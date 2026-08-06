-- ============================================================
-- MIGRATION 003 — Precios en cuotas/efectivo + envíos
-- ============================================================
-- Idempotente: se puede volver a correr sin romper nada.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Condiciones de pago (globales por tienda)
--    installments          → cuántas cuotas se ofrecen en MercadoPago
--    cash_discount_percent → % off por efectivo o transferencia
--    Viven en store_settings para poder cambiarlos desde el panel
--    sin tocar código ni redeployar.
-- ------------------------------------------------------------
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS installments INTEGER NOT NULL DEFAULT 3
    CHECK (installments BETWEEN 1 AND 24);

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS cash_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 10
    CHECK (cash_discount_percent >= 0 AND cash_discount_percent <= 100);


-- ------------------------------------------------------------
-- 2. Tarifas de envío
--    Cuatro combinaciones de zona × modalidad. Provisorias hasta
--    que se conecte la cotización en vivo de Correo Argentino:
--    cuando eso pase se reemplaza el cálculo y el resto del flujo
--    (pedido, cola de despacho, tracking) queda igual.
-- ------------------------------------------------------------
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS ship_home_caba   NUMERIC(12,2) NOT NULL DEFAULT 10000 CHECK (ship_home_caba   >= 0),
  ADD COLUMN IF NOT EXISTS ship_branch_caba NUMERIC(12,2) NOT NULL DEFAULT 8000  CHECK (ship_branch_caba >= 0),
  ADD COLUMN IF NOT EXISTS ship_home_rest   NUMERIC(12,2) NOT NULL DEFAULT 12000 CHECK (ship_home_rest   >= 0),
  ADD COLUMN IF NOT EXISTS ship_branch_rest NUMERIC(12,2) NOT NULL DEFAULT 10000 CHECK (ship_branch_rest >= 0);


-- ------------------------------------------------------------
-- 3. Envío y seguimiento a nivel pedido
--    shipping_cost queda congelado en el pedido: si mañana subís
--    las tarifas, los pedidos viejos siguen mostrando lo que el
--    cliente realmente pagó.
-- ------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method TEXT CHECK (shipping_method IN ('domicilio','sucursal')),
  ADD COLUMN IF NOT EXISTS shipping_zone   TEXT CHECK (shipping_zone   IN ('caba_gba','resto')),
  ADD COLUMN IF NOT EXISTS shipping_cost   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;

-- Índice para la cola de despacho: pagados que todavía no salieron.
CREATE INDEX IF NOT EXISTS idx_orders_to_dispatch
  ON orders(tenant_id, created_at)
  WHERE shipped_at IS NULL;


-- ------------------------------------------------------------
-- 3b. Habilitar 'cash' como medio de pago
--     El CHECK original sólo aceptaba mercadopago/card/stripe, así
--     que cualquier pedido en efectivo o transferencia moría con
--     un 23514 al insertarse. 'stripe' se mantiene para no invalidar
--     pedidos históricos que ya lo tengan.
-- ------------------------------------------------------------
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('mercadopago','card','stripe','cash'));


-- ------------------------------------------------------------
-- 4. Exponer lo nuevo en la vista pública
--    CREATE OR REPLACE VIEW sólo admite agregar columnas al final,
--    por eso las nuevas van después de updated_at.
--    Sigue sin incluir mp_access_token ni mp_webhook_secret.
-- ------------------------------------------------------------
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
  updated_at,
  installments,
  cash_discount_percent,
  ship_home_caba,
  ship_branch_caba,
  ship_home_rest,
  ship_branch_rest
FROM store_settings;

-- CREATE OR REPLACE revoca los grants de la vista anterior.
GRANT SELECT ON store_settings_public TO anon, authenticated;


-- ------------------------------------------------------------
-- 5. Verificación
-- ------------------------------------------------------------
SELECT installments, cash_discount_percent,
       ship_home_caba, ship_branch_caba, ship_home_rest, ship_branch_rest
FROM   store_settings
WHERE  tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store');
