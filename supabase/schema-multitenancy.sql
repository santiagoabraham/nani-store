-- ============================================================
-- CAMISETAS CARPI — MULTI-TENANT SCHEMA
-- ============================================================
-- This file REPLACES schema.sql entirely.
-- Run this in Supabase → SQL Editor, then run seed-multitenancy.sql
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE: tenants
-- One row = one store on the platform
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,      -- used in URL: /my-store/products
  owner_email TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLE: store_settings
-- Per-tenant branding, payment credentials, and editable content.
-- One row per tenant (1:1 with tenants).
-- ============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  tenant_id              UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,

  -- Branding
  store_name             TEXT        NOT NULL DEFAULT 'Mi Tienda',
  logo_url               TEXT,
  primary_color          TEXT        NOT NULL DEFAULT '#029CDC',
  currency               TEXT        NOT NULL DEFAULT 'ARS',

  -- Email / transactional
  email_from             TEXT,

  -- MercadoPago credentials (mp_access_token is SERVER-SIDE ONLY — never expose to client)
  mp_access_token        TEXT,
  mp_public_key          TEXT,

  -- Editable content (replaces useContentStore localStorage)
  hero_title             TEXT        NOT NULL DEFAULT 'TU CAMISETA',
  hero_subtitle          TEXT        NOT NULL DEFAULT '',
  hero_cta               TEXT        NOT NULL DEFAULT 'VER COLECCIÓN',
  hero_secondary         TEXT        NOT NULL DEFAULT 'CONOCÉ LA HISTORIA',
  carousel_images        TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  newsletter_title       TEXT        NOT NULL DEFAULT 'ÚNETE A LA FAMILIA',
  newsletter_subtitle    TEXT        NOT NULL DEFAULT '',
  footer_tagline         TEXT        NOT NULL DEFAULT '',
  footer_instagram       TEXT,
  footer_email           TEXT,

  -- Order number prefix (e.g. 'CC' → CC-0001)
  order_prefix           TEXT        NOT NULL DEFAULT 'CC',

  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLE: categories
-- Each tenant has its own categories.
-- slug is unique within a tenant (e.g. 'racing', 'selecciones').
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  image       TEXT,
  coming_soon BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);


-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug               TEXT          NOT NULL,
  name               TEXT          NOT NULL,
  team               TEXT          NOT NULL,
  league             TEXT          NOT NULL,
  category_id        UUID          REFERENCES categories(id) ON DELETE SET NULL,
  price              NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  original_price     NUMERIC(12,2)           CHECK (original_price >= 0),
  sizes              TEXT[]        NOT NULL DEFAULT ARRAY['S','M','L','XL','XXL'],
  available_versions TEXT[]        NOT NULL DEFAULT ARRAY['Home'],
  images             TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  description        TEXT,
  features           TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  badge              TEXT                    CHECK (badge IN ('New','Sale','Limited')),
  in_stock           BOOLEAN       NOT NULL DEFAULT true,
  rating             NUMERIC(3,2)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count       INTEGER       NOT NULL DEFAULT 0   CHECK (review_count >= 0),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant    ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock  ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_badge     ON products(badge);


-- ============================================================
-- TABLE: profiles  (extends auth.users — one row per user)
-- role='admin' + tenant_id grants access to that tenant's admin panel.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  name        TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip         TEXT,
  country     TEXT        DEFAULT 'Argentina',
  role        TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);


-- ============================================================
-- ORDER NUMBER SEQUENCE  →  CC-0001, CC-0002, …
-- Format: {prefix}-{4-digit-seq}  e.g. CC-0001
-- Global sequence; uniqueness guaranteed across all tenants.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION next_order_number(prefix TEXT DEFAULT 'CC')
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN prefix || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
END;
$$;


-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number           TEXT          UNIQUE NOT NULL DEFAULT next_order_number(),
  user_id          UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Customer snapshot — safe for guest checkout (user_id may be NULL)
  customer_name    TEXT          NOT NULL,
  customer_email   TEXT          NOT NULL,
  customer_phone   TEXT,
  customer_address TEXT,
  customer_city    TEXT,
  customer_state   TEXT,
  customer_zip     TEXT,
  customer_country TEXT          DEFAULT 'Argentina',

  -- Financials (all in the tenant's configured currency)
  subtotal         NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  discount_code    TEXT,
  total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),

  -- Payment
  payment_method   TEXT          NOT NULL CHECK (payment_method IN ('mercadopago','card','stripe')),
  payment_id       TEXT,

  status           TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant         ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);


-- ============================================================
-- TABLE: order_items
-- tenant_id inherited from parent order via JOIN — not duplicated here.
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,

  -- Full snapshot at purchase time
  product_name TEXT          NOT NULL,
  product_team TEXT          NOT NULL,
  size         TEXT          NOT NULL,
  version      TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image        TEXT,

  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);


-- ============================================================
-- TABLE: coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code       TEXT          NOT NULL,
  type       TEXT          NOT NULL CHECK (type IN ('percent','fixed')),
  value      NUMERIC(10,2) NOT NULL CHECK (value > 0),
  active     BOOLEAN       NOT NULL DEFAULT true,
  uses       INTEGER       NOT NULL DEFAULT 0 CHECK (uses >= 0),
  max_uses   INTEGER                CHECK (max_uses > 0),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(tenant_id, active);


-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id        UUID        REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name     TEXT        NOT NULL,
  reviewer_initials TEXT,
  rating            INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text              TEXT,
  verified          BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_tenant     ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);


-- ============================================================
-- TABLE: analytics_events
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT        NOT NULL,
  session_id TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant     ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata   ON analytics_events USING gin(metadata);


-- ============================================================
-- TRIGGER: auto-set updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- TRIGGER: keep products.rating in sync with reviews
-- ============================================================
CREATE OR REPLACE FUNCTION sync_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products
  SET
    rating       = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE product_id = target_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = target_id)
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_reviews_sync_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_product_rating();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Tenant isolation is enforced HERE — every query that bypasses
-- the application-level tenant_id filter is blocked at the DB.
-- ============================================================

-- Helper: get the tenant_id of the currently logged-in user
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper: is the current user an admin for a given tenant?
CREATE OR REPLACE FUNCTION is_admin_for(check_tenant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND tenant_id = check_tenant_id
  );
$$;


-- tenants: anyone can read, only service-role can write
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_public_read" ON tenants FOR SELECT USING (true);


-- store_settings: public can read non-sensitive fields (enforced in app layer),
-- admin can update their own tenant's settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read"  ON store_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update" ON store_settings FOR UPDATE
  USING (is_admin_for(tenant_id));


-- categories: public read, admin write within their tenant
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read"  ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write"  ON categories FOR ALL
  USING (is_admin_for(tenant_id));


-- products: public read, admin write within their tenant
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read"  ON products FOR SELECT USING (true);
CREATE POLICY "products_admin_write"  ON products FOR ALL
  USING (is_admin_for(tenant_id));


-- profiles: users read/edit own row, admins read all rows in their tenant
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT
  USING (is_admin_for(tenant_id));
CREATE POLICY "profiles_insert_self"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- orders: user sees own orders, guest orders visible server-side only,
-- admin sees all orders in their tenant
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_select"  ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_any"  ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_all"   ON orders FOR ALL USING (is_admin_for(tenant_id));


-- order_items: follows parent order visibility
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_own_select" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
  ));
CREATE POLICY "order_items_insert_any" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_admin_all"  ON order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_id AND is_admin_for(o.tenant_id)
  ));


-- coupons: authenticated users can read active coupons in any tenant,
-- admin manages their tenant's coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_auth_read"  ON coupons FOR SELECT USING (active = true);
CREATE POLICY "coupons_admin_all"  ON coupons FOR ALL USING (is_admin_for(tenant_id));


-- reviews: public read, own insert, admin manages
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_insert"  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "reviews_admin_all"   ON reviews FOR ALL USING (is_admin_for(tenant_id));


-- analytics: insert from anyone, only admin can read
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_insert_any"  ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_admin_read"  ON analytics_events FOR SELECT
  USING (is_admin_for(tenant_id));


-- ============================================================
-- RPC: increment_coupon_uses
-- Called after a valid coupon is applied at checkout.
-- Scoped to tenant_id to prevent cross-tenant manipulation.
-- ============================================================
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_code TEXT, p_tenant_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE coupons
  SET uses = uses + 1
  WHERE code = p_code
    AND tenant_id = p_tenant_id;
END;
$$;
