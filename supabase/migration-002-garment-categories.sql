-- ============================================================
-- MIGRATION 002 — Tipo de prenda + categorías administrables
-- ============================================================
-- Ejecutar una sola vez sobre una base que ya tenga
-- schema-multitenancy.sql aplicado. Es idempotente: se puede
-- volver a correr sin romper nada.
-- ============================================================


-- ------------------------------------------------------------
-- 1. products.garment_type
--    Nueva dimensión de clasificación, independiente de la
--    categoría: Camisetas / Buzos / Musculosas / Shorts /
--    Remeras / Accesorios. Sin CHECK a propósito — la lista
--    se valida en la app para poder ampliarla sin tocar DDL.
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS garment_type TEXT;

CREATE INDEX IF NOT EXISTS idx_products_garment ON products(garment_type);


-- ------------------------------------------------------------
-- 2. categories.visible
--    Permite sacar una categoría de la vitrina sin borrarla
--    ni perder los productos que cuelgan de ella.
-- ------------------------------------------------------------
ALTER TABLE categories ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true;


-- ------------------------------------------------------------
-- 3. Renombrar 'Racing Club' → 'Equipos' en el tenant my-store
--    Es un UPDATE, no un DELETE: los 9 productos que apuntan a
--    esta categoría por category_id quedan intactos.
-- ------------------------------------------------------------
UPDATE categories
SET    slug = 'equipos',
       name = 'Equipos'
WHERE  tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store')
  AND  slug = 'racing';


-- ------------------------------------------------------------
-- 4. Ocultar 'Europa' sin eliminarla
-- ------------------------------------------------------------
UPDATE categories
SET    visible = false
WHERE  tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store')
  AND  slug = 'europa';


-- ------------------------------------------------------------
-- 5. Backfill de garment_type según el nombre del producto.
--    Cada UPDATE sólo toca filas que siguen en NULL, así que
--    el orden define la precedencia y volver a correr el script
--    no pisa nada de lo que hayas ajustado a mano después.
-- ------------------------------------------------------------
UPDATE products SET garment_type = 'Musculosas'
WHERE garment_type IS NULL AND name ILIKE '%musculosa%';

UPDATE products SET garment_type = 'Buzos'
WHERE garment_type IS NULL AND name ILIKE '%buzo%';

UPDATE products SET garment_type = 'Remeras'
WHERE garment_type IS NULL AND name ILIKE '%remera%';

UPDATE products SET garment_type = 'Shorts'
WHERE garment_type IS NULL AND (name ILIKE '%short%' OR name ILIKE '%pantalon%');

UPDATE products SET garment_type = 'Camisetas'
WHERE garment_type IS NULL;


-- ------------------------------------------------------------
-- 6. Verificación
-- ------------------------------------------------------------
SELECT c.slug, c.name, c.visible, count(p.id) AS productos
FROM   categories c
LEFT   JOIN products p ON p.category_id = c.id
WHERE  c.tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store')
GROUP  BY c.slug, c.name, c.visible, c.sort_order
ORDER  BY c.sort_order;

SELECT garment_type, count(*) AS productos
FROM   products
WHERE  tenant_id = (SELECT id FROM tenants WHERE slug = 'my-store')
GROUP  BY garment_type
ORDER  BY garment_type;
