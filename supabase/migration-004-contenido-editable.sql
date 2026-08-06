-- ============================================================
-- MIGRATION 004 — Contenido editable desde el panel (tanda 1)
-- ============================================================
-- Objetivo: que la tienda deje de prometer cosas que nadie
-- configuró. Todo lo que hoy es un array hardcodeado en un
-- componente pasa a la base y se edita desde el panel.
--
-- Idempotente: se puede volver a correr sin romper nada.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Bloques de beneficios ("perks")
--
--    Reemplaza dos arrays escritos a mano: la barra de la home
--    (ENVÍO GRATIS / PRODUCTO GARANTIZADO / DEVOLUCIÓN / SOPORTE)
--    y los tres de la ficha de producto.
--
--    location distingue dónde se muestra cada uno, así una sola
--    tabla cubre los dos lugares.
--    icon guarda el NOMBRE del ícono; se valida en lib/icons.ts
--    y no con un CHECK, para poder sumar íconos sin migración.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_perks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location   TEXT        NOT NULL CHECK (location IN ('home','product')),
  icon       TEXT        NOT NULL DEFAULT 'CheckCircle',
  label      TEXT        NOT NULL,
  sublabel   TEXT        NOT NULL DEFAULT '',
  visible    BOOLEAN     NOT NULL DEFAULT true,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perks_tenant_location
  ON store_perks(tenant_id, location, sort_order);

ALTER TABLE store_perks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perks_public_read" ON store_perks;
CREATE POLICY "perks_public_read" ON store_perks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "perks_admin_write" ON store_perks;
CREATE POLICY "perks_admin_write" ON store_perks
  FOR ALL USING (is_admin_for(tenant_id));


-- ------------------------------------------------------------
-- 2. Cupón anunciado en el newsletter
--
--    Hoy el newsletter promete el código BIENVENIDO, que NO
--    existe en la tabla de cupones: quien lo intentara se lo
--    encontraba rechazado en el checkout.
--    NULL = el newsletter no anuncia ningún cupón.
-- ------------------------------------------------------------
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS newsletter_coupon_code TEXT;


-- ------------------------------------------------------------
-- 3. Política de devoluciones
--
--    "Devoluciones gratis dentro de los 30 días" estaba escrito
--    en el componente. Es un compromiso comercial: sale de acá.
--    Vacío = no se muestra la línea.
-- ------------------------------------------------------------
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS returns_note TEXT NOT NULL DEFAULT '';


-- ------------------------------------------------------------
-- 4. Exponer lo nuevo en la vista pública
--    CREATE OR REPLACE VIEW sólo admite AGREGAR columnas al final.
--    Sigue sin incluir mp_access_token ni mp_webhook_secret.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW store_settings_public AS
SELECT
  tenant_id, store_name, logo_url, primary_color, currency, email_from,
  mp_public_key, hero_title, hero_subtitle, hero_cta, hero_secondary,
  carousel_images, newsletter_title, newsletter_subtitle,
  footer_tagline, footer_instagram, footer_email, order_prefix, updated_at,
  installments, cash_discount_percent,
  ship_home_caba, ship_branch_caba, ship_home_rest, ship_branch_rest,
  newsletter_coupon_code, returns_note
FROM store_settings;

GRANT SELECT ON store_settings_public TO anon, authenticated;


-- ------------------------------------------------------------
-- 5. Sembrar los perks actuales
--
--    Se cargan los textos que HOY están hardcodeados, para que
--    la tienda no cambie de aspecto al desplegar: a partir de
--    ahora son editables, pero arrancan igual.
--
--    Las promesas que Santiago nunca configuró (envío gratis,
--    soporte 24/7) se siembran OCULTAS: que decida él si las
--    sostiene, en lugar de seguir anunciándolas por omisión.
-- ------------------------------------------------------------
INSERT INTO store_perks (tenant_id, location, icon, label, sublabel, visible, sort_order)
SELECT t.id, v.location, v.icon, v.label, v.sublabel, v.visible, v.sort_order
FROM   tenants t
CROSS  JOIN (VALUES
  ('home',    'Truck',       'ENVÍO A TODO EL PAÍS',   'Por Correo Argentino', true,  0),
  ('home',    'Award',       'PRODUCTO GARANTIZADO',   'Calidad certificada',  true,  1),
  ('home',    'CheckCircle', 'DEVOLUCIÓN GRATIS',      '30 días',              false, 2),
  ('home',    'Headphones',  'SOPORTE 24/7',           'Siempre disponibles',  false, 3),
  ('product', 'Truck',       'Envío a todo el país',   'Correo Argentino',     true,  0),
  ('product', 'Shield',      'Autenticidad',           'Garantizada',          true,  1),
  ('product', 'RotateCcw',   'Devolución',             '30 días',              false, 2)
) AS v(location, icon, label, sublabel, visible, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM store_perks p WHERE p.tenant_id = t.id AND p.location = v.location
);


-- ------------------------------------------------------------
-- 6. Verificación
-- ------------------------------------------------------------
SELECT location, label, sublabel, visible, sort_order
FROM   store_perks
WHERE  tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store')
ORDER  BY location, sort_order;
