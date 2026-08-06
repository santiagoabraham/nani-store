-- ============================================================
-- SECURITY HARDENING — Run AFTER schema-multitenancy.sql
-- ============================================================
-- Fixes:
--   1. mp_access_token column exposure via REST API
--   2. Atomic coupon claim (TOCTOU fix)
--   3. Coupon RLS scoping
-- ============================================================


-- ============================================================
-- FIX 1: Protect mp_access_token from REST API exposure
--
-- Problem: store_settings has USING (true) RLS, meaning any
-- holder of the anon key can call:
--   GET /rest/v1/store_settings?select=mp_access_token
-- and receive every tenant's MP access token.
--
-- Solution:
--   a) Revoke SELECT on the base table from public roles
--   b) Create a view with only safe columns
--   c) Grant SELECT on the view instead
-- ============================================================

-- Revoke direct SELECT on base table (UPDATE/INSERT/DELETE unaffected)
REVOKE SELECT ON TABLE store_settings FROM anon, authenticated;

-- Safe view: identical to StoreSettings TypeScript type (no mp_access_token)
CREATE OR REPLACE VIEW store_settings_public AS
SELECT
  tenant_id,
  store_name,
  logo_url,
  primary_color,
  currency,
  email_from,
  mp_public_key,
  hero_title,
  hero_subtitle,
  hero_cta,
  hero_secondary,
  carousel_images,
  newsletter_title,
  newsletter_subtitle,
  footer_tagline,
  footer_instagram,
  footer_email,
  order_prefix,
  updated_at
FROM store_settings;

-- Expose the view via PostgREST
GRANT SELECT ON store_settings_public TO anon, authenticated;


-- ============================================================
-- FIX 2: Atomic coupon claim
--
-- Problem: validate → check → increment is 3 separate steps.
-- A concurrent request can pass validation before either
-- increments the count, allowing a coupon to be used more
-- times than max_uses.
--
-- Also: the old flow incremented at validation time (cart),
-- not at order creation. Abandoned checkouts wasted uses.
--
-- Solution: A single atomic UPDATE that validates AND
-- increments in one operation. Called only at order creation.
-- The /api/coupons/validate endpoint now only reads (no side
-- effects), keeping the cart UX intact.
-- ============================================================
CREATE OR REPLACE FUNCTION claim_coupon(p_code TEXT, p_tenant_id UUID)
RETURNS TABLE(
  valid            BOOLEAN,
  discount_percent NUMERIC,
  message          TEXT,
  coupon_type      TEXT,
  coupon_value     NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
BEGIN
  -- Single atomic operation: validate + increment
  UPDATE coupons
  SET uses = uses + 1
  WHERE code         = upper(trim(p_code))
    AND tenant_id    = p_tenant_id
    AND active       = true
    AND (max_uses IS NULL OR uses < max_uses)
  RETURNING * INTO v_coupon;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      0::NUMERIC,
      'Cupón inválido, expirado o sin usos disponibles'::TEXT,
      NULL::TEXT,
      NULL::NUMERIC;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true::BOOLEAN,
    CASE WHEN v_coupon.type = 'percent' THEN v_coupon.value ELSE 0::NUMERIC END,
    ('¡' || v_coupon.value::TEXT ||
      CASE WHEN v_coupon.type = 'percent' THEN '%' ELSE ' ARS' END ||
      ' de descuento aplicado!')::TEXT,
    v_coupon.type::TEXT,
    v_coupon.value::NUMERIC;
END;
$$;


-- ============================================================
-- FIX 3: Tighten coupon SELECT RLS
--
-- Problem: coupons_auth_read allows ANY authenticated user to
-- SELECT active coupons from ALL tenants. A logged-in user
-- from tenant A could enumerate tenant B's coupon codes.
--
-- Fix: Only allow coupon reads scoped to the user's own tenant.
-- The /api/coupons/validate endpoint uses validateCoupon() which
-- already filters by tenant_id at the application layer.
-- This RLS makes the DB layer consistent.
-- ============================================================
DROP POLICY IF EXISTS "coupons_auth_read" ON coupons;

CREATE POLICY "coupons_tenant_read" ON coupons
  FOR SELECT
  USING (
    tenant_id = current_user_tenant_id()
    OR
    -- Allow service role (used by API routes for guest checkout)
    current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
  );


-- ============================================================
-- FIX 4: RLS on orders — restrict INSERT to valid tenants
--
-- Problem: orders_insert_any allows INSERT of an order with
-- any tenant_id, including tenants that don't exist.
--
-- Fix: Verify tenant exists at INSERT time.
-- ============================================================
DROP POLICY IF EXISTS "orders_insert_any" ON orders;

CREATE POLICY "orders_insert_verified" ON orders
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id)
  );


-- ============================================================
-- NOTE: After running this file, update lib/tenant.ts:
--   getTenantBySlug → query 'store_settings_public' view
--   getMpAccessToken → use createServiceClient() (service role)
-- ============================================================
