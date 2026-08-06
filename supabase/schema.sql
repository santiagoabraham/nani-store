-- ============================================================
-- CAMISETAS CARPI — SUPABASE SCHEMA
-- ============================================================
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor → New query
--   2. Paste THIS ENTIRE FILE → click Run
--   3. Then run seed.sql in a second query
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        PRIMARY KEY,                        -- 'racing', 'selecciones', 'europa', 'ligas-locales'
  name        TEXT        NOT NULL,
  description TEXT,
  image       TEXT,
  coming_soon BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT        UNIQUE NOT NULL,
  name               TEXT        NOT NULL,
  team               TEXT        NOT NULL,
  league             TEXT        NOT NULL,
  category_id        TEXT        NOT NULL REFERENCES categories(id) ON UPDATE CASCADE,
  price              NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  original_price     NUMERIC(12,2)          CHECK (original_price >= 0),
  sizes              TEXT[]      NOT NULL DEFAULT ARRAY['S','M','L','XL','XXL'],
  available_versions TEXT[]      NOT NULL DEFAULT ARRAY['Home'],
  images             TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  description        TEXT,
  features           TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
  badge              TEXT                   CHECK (badge IN ('New','Sale','Limited')),
  in_stock           BOOLEAN     NOT NULL DEFAULT true,
  rating             NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  review_count       INTEGER     NOT NULL DEFAULT 0   CHECK (review_count >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_badge    ON products(badge);


-- ============================================================
-- TABLE: profiles  (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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


-- ============================================================
-- ORDER NUMBER SEQUENCE  →  CC-001, CC-002, …
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION next_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'CC-' || LPAD(nextval('order_number_seq')::TEXT, 3, '0');
END;
$$;


-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  number           TEXT          UNIQUE NOT NULL DEFAULT next_order_number(),
  user_id          UUID          REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Customer snapshot (safe for guest checkout — user_id may be NULL)
  customer_name    TEXT          NOT NULL,
  customer_email   TEXT          NOT NULL,
  customer_phone   TEXT,
  customer_address TEXT,
  customer_city    TEXT,
  customer_state   TEXT,
  customer_zip     TEXT,
  customer_country TEXT          DEFAULT 'Argentina',

  -- Financials (all in ARS)
  subtotal         NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  discount_code    TEXT,
  total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),

  -- Payment
  payment_method   TEXT          NOT NULL CHECK (payment_method IN ('mercadopago','card','stripe')),
  payment_id       TEXT,                                      -- external provider reference

  status           TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);


-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,  -- nullable: product may be deleted later

  -- Full snapshot at purchase time so order history never changes
  product_name TEXT          NOT NULL,
  product_team TEXT          NOT NULL,
  size         TEXT          NOT NULL,
  version      TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  price        NUMERIC(12,2) NOT NULL CHECK (price >= 0),    -- unit price at purchase
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
  code       TEXT          UNIQUE NOT NULL,
  type       TEXT          NOT NULL CHECK (type IN ('percent','fixed')),
  value      NUMERIC(10,2) NOT NULL CHECK (value > 0),
  active     BOOLEAN       NOT NULL DEFAULT true,
  uses       INTEGER       NOT NULL DEFAULT 0 CHECK (uses >= 0),
  max_uses   INTEGER                CHECK (max_uses > 0),    -- NULL = unlimited
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code   ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);


-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID        REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name     TEXT        NOT NULL,
  reviewer_initials TEXT,
  rating            INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text              TEXT,
  verified          BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating     ON reviews(rating);


-- ============================================================
-- TABLE: analytics_events
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT        NOT NULL,
  session_id TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata   ON analytics_events USING gin(metadata);


-- ============================================================
-- TRIGGER: auto-set updated_at on every UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
-- TRIGGER: auto-create profile when a user signs up
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
-- TRIGGER: auto-update product rating when a review changes
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
-- ============================================================

-- categories: anyone can read, only admins can write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_admin_write"
  ON categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- products: anyone can read, only admins can write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "products_admin_write"
  ON products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- profiles: users can only read/edit their own row, admins can do everything
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- orders: users see their own, guest orders are visible by email match not needed here,
--         anyone can INSERT (guest checkout), admins see everything
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_own_select"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_any"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_admin_all"
  ON orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- order_items: follow parent order's visibility
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_own_select"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "order_items_insert_any"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "order_items_admin_all"
  ON order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- coupons: authenticated users can read active ones, admins manage all
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_authenticated_read"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "coupons_admin_all"
  ON coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- reviews: anyone can read, authenticated users can insert their own
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_own_insert"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "reviews_admin_all"
  ON reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- analytics: anyone can insert, only admins can read
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_any"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "analytics_admin_read"
  ON analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
