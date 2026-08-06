-- ============================================================
-- RLS HARDENING — Run AFTER security-hardening.sql
-- ============================================================
-- Fixes:
--   1. SECURITY DEFINER on helper functions (prevent RLS recursion)
--   2. Dead settings_public_read policy cleanup
--   3. Coupons policy — remove incorrect service_role JWT check
--   4. Orders/order_items INSERT locked to service role only
--   5. Analytics INSERT — require valid tenant
--   6. Reviews INSERT — require tenant/product cross-check
--   7. mp_webhook_secret column + view rebuild
--   8. Idempotent order status transition function
-- ============================================================
-- IMPORTANT: Apply TypeScript changes (service client in createOrder,
-- updateStoreSettings, validateCoupon) AT THE SAME TIME as this SQL.
-- ============================================================


-- ============================================================
-- FIX 1: SECURITY DEFINER on helper functions
--
-- Problem: current_user_tenant_id() and is_admin_for() query the
-- profiles table. When evaluated inside an RLS policy ON profiles,
-- this creates a recursive policy evaluation loop.
--
-- Fix: SECURITY DEFINER makes the function run as its owner
-- (postgres), bypassing RLS on the inner profiles query entirely.
-- The functions remain correct — they still use auth.uid() to
-- scope results to the calling user.
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin_for(check_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND tenant_id = check_tenant_id
  );
$$;


-- ============================================================
-- FIX 2: Remove dead settings_public_read policy
--
-- Problem: security-hardening.sql did REVOKE SELECT ON store_settings
-- FROM anon, authenticated — but left the policy in place. A dead
-- policy is misleading and makes the security model harder to audit.
-- The view store_settings_public is the only valid read path.
-- ============================================================
DROP POLICY IF EXISTS "settings_public_read" ON store_settings;


-- ============================================================
-- FIX 3: Coupons — fix broken service_role JWT check
--
-- Problem: The coupons_tenant_read policy had:
--   OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
--
-- This is wrong for two reasons:
--   a) The service_role key bypasses RLS entirely — it never hits
--      the policy evaluator, so this branch is dead code.
--   b) If someone crafts a JWT with role='service_role', this check
--      would grant them unrestricted coupon reads across all tenants
--      (Supabase validates the service role key, but the check is
--      still semantically dangerous).
--
-- Fix: Simplify to tenant-scoped read for authenticated users only.
-- Anon coupon validation goes through the service client in
-- lib/db/coupons.ts (server-side, already tenant-filtered).
-- ============================================================
DROP POLICY IF EXISTS "coupons_tenant_read" ON coupons;
DROP POLICY IF EXISTS "coupons_auth_read" ON coupons;

CREATE POLICY "coupons_tenant_scoped_read" ON coupons
  FOR SELECT USING (
    tenant_id = current_user_tenant_id()
  );


-- ============================================================
-- FIX 4: Lock orders/order_items INSERT to service role only
--
-- Problem: Both tables allow INSERT via the anon/authenticated
-- roles, meaning anyone who knows product UUIDs can call:
--   POST /rest/v1/orders  { total: 0, ... }
-- and create a zero-cost order, bypassing server-side price
-- verification entirely.
--
-- Fix: Revoke INSERT from anon and authenticated. All order
-- creation goes through app/[tenant]/api/orders/route.ts which
-- uses createServiceClient() after server-side price verification.
--
-- NOTE: Apply TypeScript changes (createOrder → service client)
-- before or simultaneously with this SQL, or order creation will
-- break.
-- ============================================================
REVOKE INSERT ON orders      FROM anon, authenticated;
REVOKE INSERT ON order_items FROM anon, authenticated;

DROP POLICY IF EXISTS "orders_insert_any"      ON orders;
DROP POLICY IF EXISTS "orders_insert_verified" ON orders;
DROP POLICY IF EXISTS "order_items_insert_any"      ON order_items;
DROP POLICY IF EXISTS "order_items_insert_verified" ON order_items;
-- Service role bypasses RLS; no INSERT policy needed for anon/authenticated.


-- ============================================================
-- FIX 5: Analytics INSERT — require valid tenant
--
-- Problem: analytics_insert_any has WITH CHECK (true), allowing
-- anyone to spam analytics events for any tenant_id including
-- non-existent ones. This bloats the table and pollutes dashboards.
--
-- Fix: Require tenant_id references a real tenant.
-- ============================================================
DROP POLICY IF EXISTS "analytics_insert_any" ON analytics_events;

CREATE POLICY "analytics_insert_verified" ON analytics_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id)
  );


-- ============================================================
-- FIX 6: Reviews INSERT — add tenant + product cross-check
--
-- Problem: reviews_own_insert only checks auth.uid() = user_id
-- OR user_id IS NULL. No check that:
--   a) the review's tenant_id is valid
--   b) the product being reviewed belongs to that tenant
-- An attacker could inject reviews for tenant B's products while
-- appearing to be from tenant A.
--
-- Fix: Verify the product's tenant_id matches the review's tenant_id.
-- ============================================================
DROP POLICY IF EXISTS "reviews_own_insert" ON reviews;

CREATE POLICY "reviews_own_insert" ON reviews
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id OR user_id IS NULL)
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
        AND products.tenant_id = reviews.tenant_id
    )
  );


-- ============================================================
-- FIX 7: Add mp_webhook_secret + rebuild public view
--
-- mp_webhook_secret: the secret used to verify MercadoPago
-- webhook signatures (HMAC-SHA256). Never exposed to the client.
-- Stored alongside mp_access_token on the base table.
--
-- The store_settings_public view is recreated explicitly to ensure
-- mp_webhook_secret is not included even if views were cached.
-- ============================================================
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS mp_webhook_secret TEXT;

-- Rebuild with explicit column list — excludes mp_access_token AND mp_webhook_secret
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

-- Re-grant (CREATE OR REPLACE revokes grants on the old view)
GRANT SELECT ON store_settings_public TO anon, authenticated;


-- ============================================================
-- FIX 8: Idempotent order status transition function
--
-- Used by the MercadoPago webhook to update order status.
-- Enforces allowed transitions only:
--   pending  → paid | cancelled
--   paid     → shipped | cancelled
--   shipped  → delivered
-- Calling it with the current status is a no-op (idempotent),
-- so duplicate webhooks are safe.
-- Returns TRUE if the transition was applied or already current.
-- ============================================================
CREATE OR REPLACE FUNCTION transition_order_status(
  p_order_id   UUID,
  p_tenant_id  UUID,
  p_new_status TEXT,
  p_payment_id TEXT DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Lock the row to serialise concurrent webhook deliveries
  SELECT status INTO v_status
    FROM orders
   WHERE id = p_order_id AND tenant_id = p_tenant_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Idempotent: already in the desired state
  IF v_status = p_new_status THEN
    RETURN TRUE;
  END IF;

  -- Enforce forward-only state machine
  IF (v_status = 'pending'  AND p_new_status IN ('paid', 'cancelled'))
  OR (v_status = 'paid'     AND p_new_status IN ('shipped', 'cancelled'))
  OR (v_status = 'shipped'  AND p_new_status = 'delivered')
  THEN
    UPDATE orders
       SET status     = p_new_status,
           payment_id = COALESCE(p_payment_id, payment_id),
           updated_at = now()
     WHERE id = p_order_id AND tenant_id = p_tenant_id;
    RETURN TRUE;
  END IF;

  -- Invalid or backward transition — reject silently
  RETURN FALSE;
END;
$$;


-- ============================================================
-- FIX 9: Per-tenant order sequence
--
-- Problem: A global sequence (e.g. orders table SERIAL) leaks
-- business scale — Tenant A can infer Tenant B's order volume
-- from gaps in their own order numbers.
--
-- Fix: Each tenant has an order_counter column in store_settings.
-- next_order_number_for_tenant() increments it atomically with
-- FOR UPDATE row lock, then returns a formatted order number.
-- The TypeScript createOrder() calls this RPC before INSERT.
-- ============================================================
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS order_counter INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION next_order_number_for_tenant(
  p_tenant_id UUID,
  p_prefix    TEXT DEFAULT 'ORD'
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  UPDATE store_settings
     SET order_counter = order_counter + 1
   WHERE tenant_id = p_tenant_id
   RETURNING order_counter INTO v_counter;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant % not found in store_settings', p_tenant_id;
  END IF;

  -- Format: PREFIX-0001, PREFIX-0002, …
  RETURN p_prefix || '-' || LPAD(v_counter::TEXT, 4, '0');
END;
$$;


-- ============================================================
-- STORAGE: products bucket policy guidance
--
-- Run in Supabase Dashboard → Storage → Policies after creating
-- the 'products' bucket (set Public = true for URL serving).
--
-- Recommended policies:
--   SELECT (public read):  bucket_id = 'products'
--   INSERT (admin only):   auth.role() = 'authenticated'
--                          AND is_admin_for(...)  -- checked in app layer
--   DELETE (admin only):   same
--
-- The app upload route already enforces admin auth before
-- calling the storage API with the service client.
-- ============================================================
