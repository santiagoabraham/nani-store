-- ============================================================
-- CAMISETAS CARPI — MULTI-TENANT SEED DATA
-- ============================================================
-- Run AFTER schema-multitenancy.sql has completed.
-- This seeds the default demo tenant with all products,
-- categories, coupons, and reviews.
-- ============================================================


-- ============================================================
-- 1. DEFAULT TENANT
-- ============================================================
INSERT INTO tenants (id, name, slug, owner_email)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Camisetas Carpi',
  'carpi-demo',
  'admin@camisetascarpi.com.ar'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 2. STORE SETTINGS
-- ============================================================
INSERT INTO store_settings (
  tenant_id,
  store_name,
  primary_color,
  currency,
  email_from,
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
  order_prefix
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Camisetas Carpi',
  '#029CDC',
  'ARS',
  'hola@camisetascarpi.com.ar',
  'TU CAMISETA',
  'La mejor indumentaria de fútbol. Racing Club, Selección Argentina, Real Madrid y los mejores clubes del mundo.',
  'VER COLECCIÓN',
  'CONOCÉ LA HISTORIA',
  ARRAY[
    'https://placehold.co/1400x600/00273E/FFFFFF?text=Nueva+Colección+2024',
    'https://placehold.co/1400x600/029CDC/FFFFFF?text=Racing+Club+Titular',
    'https://placehold.co/1400x600/74ACDF/FFFFFF?text=Selección+Argentina'
  ],
  'ÚNETE A LA FAMILIA',
  'Recibí las últimas novedades, lanzamientos exclusivos y descuentos directo a tu casilla.',
  'Tu camiseta, tu pasión.',
  '@camisetas.carpi.rc',
  'hola@camisetascarpi.com.ar',
  'CC'
)
ON CONFLICT (tenant_id) DO NOTHING;


-- ============================================================
-- 3. CATEGORIES
-- ============================================================
INSERT INTO categories (tenant_id, slug, name, description, image, coming_soon, sort_order)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'racing',       'Racing Club',   'La Academia, titular y alternativa',         'https://placehold.co/500x350/003087/FFFFFF?text=Racing+Club',     false, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'selecciones',  'Selecciones',   'Argentina titular y tercera',                'https://placehold.co/500x350/74ACDF/FFFFFF?text=Selecciones',     false, 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'europa',       'Europa',        'Real Madrid, Barcelona, City, PSG',          'https://placehold.co/500x350/1C1C3C/E3051B?text=Europa',          false, 3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'ligas-locales','Ligas Locales', 'Próximamente',                               'https://placehold.co/500x350/4B5563/FFFFFF?text=Próximamente',    true,  4)
ON CONFLICT (tenant_id, slug) DO NOTHING;


-- ============================================================
-- 4. PRODUCTS
-- Uses subqueries to reference category IDs by slug
-- ============================================================
INSERT INTO products (
  tenant_id, slug, name, team, league, category_id,
  price, original_price, sizes, available_versions,
  images, description, features, badge, in_stock, rating, review_count
)
VALUES

-- Racing Titular
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'racing-titular-2024',
  'Camiseta Racing Club Titular 2024',
  'Racing Club', 'Liga Profesional',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'racing'),
  35000.00, 42000.00,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home'],
  ARRAY['https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024','https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024-back'],
  'Camiseta oficial titular de Racing Club temporada 2024. Azul y blanco, tecnología DryFit, escudo bordado. La Academia en tu piel.',
  ARRAY['Tecnología DryFit transpirable','Escudo Racing bordado oficial','Tela 100% poliéster de alta calidad','Corte atlético moderno','Apto lavado a máquina hasta 30°C'],
  'Sale', true, 4.9, 312
),

-- Racing Alternativa
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'racing-alternativa-2024',
  'Camiseta Racing Club Alternativa 2024',
  'Racing Club', 'Liga Profesional',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'racing'),
  35000.00, NULL,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Away'],
  ARRAY['https://placehold.co/600x800/E3051B/FFFFFF?text=racing-alternativa-2024','https://placehold.co/600x800/E3051B/FFFFFF?text=racing-alternativa-2024-back'],
  'Versión alternativa de Racing Club 2024. Rojo intenso con detalles en blanco, corte moderno.',
  ARRAY['Tecnología DryFit transpirable','Escudo Racing bordado oficial','Rojo intenso Racing Club','Slim fit moderno','Apto lavado a máquina'],
  'New', true, 4.8, 187
),

-- Argentina Titular
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'argentina-titular-2024',
  'Camiseta Argentina Titular 2024',
  'Selección Argentina', 'AFA',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'selecciones'),
  38000.00, 45000.00,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home','Away'],
  ARRAY['https://placehold.co/600x800/74ACDF/FFFFFF?text=argentina-titular-2024','https://placehold.co/600x800/74ACDF/FFFFFF?text=argentina-titular-2024-back'],
  'Camiseta de la Selección Argentina, campeona del mundo. Celeste y blanco, parche de campeón. Las tres estrellas que conquistaron Qatar 2022.',
  ARRAY['Tecnología Dri-FIT ADV','Escudo AFA bordado con 3 estrellas','Parche oficial Campeón del Mundo','Corte atlético championship','Certificado de autenticidad'],
  'New', true, 5.0, 428
),

-- Argentina Tercera
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'argentina-tercera-2024',
  'Camiseta Argentina Tercera 2024',
  'Selección Argentina', 'AFA',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'selecciones'),
  38000.00, NULL,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Third'],
  ARRAY['https://placehold.co/600x800/5B2D8E/FFFFFF?text=argentina-tercera-2024','https://placehold.co/600x800/5B2D8E/FFFFFF?text=argentina-tercera-2024-back'],
  'Tercera camiseta de la Selección Argentina 2024. Color violeta exclusivo, edición limitada que se agota rápido.',
  ARRAY['Edición limitada coleccionable','Color violeta exclusivo','Escudo AFA bordado con 3 estrellas','Tejido premium breathable','Numerado y certificado'],
  'Limited', true, 4.9, 203
),

-- Real Madrid
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'real-madrid-titular-2025',
  'Camiseta Real Madrid Titular 2024/25',
  'Real Madrid', 'La Liga',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'europa'),
  40000.00, 48000.00,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home','Away','Third'],
  ARRAY['https://placehold.co/600x800/FFFFFF/003087?text=real-madrid-titular-2025','https://placehold.co/600x800/FFFFFF/003087?text=real-madrid-titular-2025-back'],
  'Camiseta oficial del Real Madrid temporada 2024/25. Blanco puro, tecnología Adidas HEAT.RDY para máximo rendimiento.',
  ARRAY['Tecnología Adidas HEAT.RDY','Escudo Real Madrid bordado oficial','Blanco puro icónico','Certificado de autenticidad','Apto lavado a máquina'],
  'Sale', true, 4.8, 247
),

-- Barcelona
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'barcelona-titular-2025',
  'Camiseta Barcelona Titular 2024/25',
  'FC Barcelona', 'La Liga',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'europa'),
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home','Away'],
  ARRAY['https://placehold.co/600x800/A50044/FFFFFF?text=barcelona-titular-2025','https://placehold.co/600x800/A50044/FFFFFF?text=barcelona-titular-2025-back'],
  'Camiseta oficial del FC Barcelona 2024/25. Azulgrana clásico con detalles dorados.',
  ARRAY['Tecnología Nike Dri-FIT ADV','Escudo FC Barcelona bordado','Azulgrana con detalles dorados','Slim fit moderno','Material reciclado 100%'],
  'New', true, 4.7, 183
),

-- Manchester City
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'manchester-city-titular-2025',
  'Camiseta Manchester City Titular 2024/25',
  'Manchester City', 'Premier League',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'europa'),
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home','Away','Third'],
  ARRAY['https://placehold.co/600x800/6CADDF/FFFFFF?text=manchester-city-titular-2025','https://placehold.co/600x800/6CADDF/FFFFFF?text=manchester-city-titular-2025-back'],
  'Camiseta del Manchester City 2024/25. Celeste cielo con detalles en blanco, Puma.',
  ARRAY['Tecnología Puma ULTRAWEAVE','Escudo City bordado oficial','Celeste Sky Blue icónico','Regular fit performance','Certificado OEKO-TEX'],
  NULL, true, 4.6, 156
),

-- PSG
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'psg-titular-2025',
  'Camiseta PSG Titular 2024/25',
  'Paris Saint-Germain', 'Ligue 1',
  (SELECT id FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'europa'),
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'], ARRAY['Home','Away','Third'],
  ARRAY['https://placehold.co/600x800/1C1C3C/E3051B?text=psg-titular-2025','https://placehold.co/600x800/1C1C3C/E3051B?text=psg-titular-2025-back'],
  'Camiseta del Paris Saint-Germain 2024/25. Azul marino con franja roja, Nike Dri-FIT.',
  ARRAY['Tecnología Nike Dri-FIT','Escudo PSG bordado oficial','Azul marino con franja roja','Slim fit parisino','Apto lavado a máquina'],
  'New', true, 4.7, 134
)

ON CONFLICT (tenant_id, slug) DO NOTHING;


-- ============================================================
-- 5. COUPONS
-- ============================================================
INSERT INTO coupons (tenant_id, code, type, value, active, uses)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'CARPI10',     'percent', 10, true, 47),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'CARPI20',     'percent', 20, true, 23),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'FOOTBALL',   'percent', 15, true, 31),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'BIENVENIDO', 'percent',  5, true, 89)
ON CONFLICT (tenant_id, code) DO NOTHING;


-- ============================================================
-- 6. REVIEWS
-- ============================================================
INSERT INTO reviews (tenant_id, product_id, reviewer_name, reviewer_initials, rating, text, verified, created_at)
VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'racing-titular-2024'),
  'Martín Acuña', 'MA', 5,
  'La titular de Racing llegó perfecta, igual a la que usan en el Cilindro. El escudo bordado se ve espectacular y la tela es muy cómoda. ¡Aguante La Academia!',
  true, '2025-03-10 10:00:00+00'
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'argentina-titular-2024'),
  'Valentina Cruz', 'VC', 5,
  'Pedí la Argentina para mi hermano y quedó re contento. La calidad es increíble, el parche de campeón y las tres estrellas se ven perfectas. 100% recomendado.',
  true, '2025-03-18 14:30:00+00'
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'racing-alternativa-2024'),
  'Lucas Ferreiro', 'LF', 5,
  'La alternativa roja de Racing es una obra de arte. Me la puse para el clásico y todos me preguntaban dónde la compré. Llegó en dos días, impecable.',
  true, '2025-03-25 09:15:00+00'
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'argentina-tercera-2024'),
  'Sofía Moreno', 'SM', 4,
  'La Argentina tercera violeta es una locura, diseño único. Llegó bien embalada y el talle M me quedó perfecto según la guía. Muy buena experiencia de compra.',
  true, '2025-04-02 16:45:00+00'
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'real-madrid-titular-2025'),
  'Tomás Ibáñez', 'TI', 5,
  'Compré la del Real Madrid y es idéntica a la original. La textura de la tela y el acabado del escudo son de primera. Ya hice el segundo pedido.',
  true, '2025-04-15 11:20:00+00'
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  (SELECT id FROM products WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001' AND slug = 'barcelona-titular-2025'),
  'Camila Ríos', 'CR', 5,
  'Uso Carpi para comprar camisetas hace meses y nunca me fallaron. Siempre llegan antes de lo esperado y la calidad es impecable. Los mejores del rubro.',
  true, '2025-04-22 18:00:00+00'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- VERIFICATION QUERY — run after seed to confirm counts
-- ============================================================
-- SELECT
--   (SELECT COUNT(*) FROM tenants)             AS tenants,
--   (SELECT COUNT(*) FROM store_settings)      AS settings,
--   (SELECT COUNT(*) FROM categories WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001') AS categories,
--   (SELECT COUNT(*) FROM products   WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001') AS products,
--   (SELECT COUNT(*) FROM coupons    WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001') AS coupons,
--   (SELECT COUNT(*) FROM reviews    WHERE tenant_id = 'a1b2c3d4-0000-0000-0000-000000000001') AS reviews;
-- Expected: 1 | 1 | 4 | 8 | 4 | 6
