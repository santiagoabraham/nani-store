-- ============================================================
-- CAMISETAS CARPI — SEED DATA
-- ============================================================
-- HOW TO RUN:
--   Run this AFTER schema.sql has completed successfully.
--   Open Supabase → SQL Editor → New query → paste → Run
-- ============================================================


-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, description, image, coming_soon, sort_order) VALUES
  (
    'racing',
    'Racing Club',
    'La Academia, titular y alternativa',
    'https://placehold.co/500x350/003087/FFFFFF?text=Racing+Club',
    false, 1
  ),
  (
    'selecciones',
    'Selecciones',
    'Argentina titular y tercera',
    'https://placehold.co/500x350/74ACDF/FFFFFF?text=Selecciones',
    false, 2
  ),
  (
    'europa',
    'Europa',
    'Real Madrid, Barcelona, City, PSG',
    'https://placehold.co/500x350/1C1C3C/E3051B?text=Europa',
    false, 3
  ),
  (
    'ligas-locales',
    'Ligas Locales',
    'Próximamente',
    'https://placehold.co/500x350/4B5563/FFFFFF?text=Próximamente',
    true, 4
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PRODUCTS  (8 jerseys matching lib/data.ts exactly)
-- ============================================================
INSERT INTO products
  (slug, name, team, league, category_id, price, original_price,
   sizes, available_versions, images, description, features, badge, in_stock, rating, review_count)
VALUES

-- 1. Racing Titular
(
  'racing-titular-2024',
  'Camiseta Racing Club Titular 2024',
  'Racing Club', 'Liga Profesional', 'racing',
  35000.00, 42000.00,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home'],
  ARRAY[
    'https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024',
    'https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024-back'
  ],
  'Camiseta oficial titular de Racing Club temporada 2024. Azul y blanco, tecnología DryFit, escudo bordado. La Academia en tu piel.',
  ARRAY[
    'Tecnología DryFit transpirable',
    'Escudo Racing bordado oficial',
    'Tela 100% poliéster de alta calidad',
    'Corte atlético moderno',
    'Apto lavado a máquina hasta 30°C'
  ],
  'Sale', true, 4.9, 312
),

-- 2. Racing Alternativa
(
  'racing-alternativa-2024',
  'Camiseta Racing Club Alternativa 2024',
  'Racing Club', 'Liga Profesional', 'racing',
  35000.00, NULL,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Away'],
  ARRAY[
    'https://placehold.co/600x800/E3051B/FFFFFF?text=racing-alternativa-2024',
    'https://placehold.co/600x800/E3051B/FFFFFF?text=racing-alternativa-2024-back'
  ],
  'Versión alternativa de Racing Club 2024. Rojo intenso con detalles en blanco, corte moderno. Ideal para hinchar desde las tribunas.',
  ARRAY[
    'Tecnología DryFit transpirable',
    'Escudo Racing bordado oficial',
    'Rojo intenso Racing Club',
    'Slim fit moderno',
    'Apto lavado a máquina'
  ],
  'New', true, 4.8, 187
),

-- 3. Argentina Titular
(
  'argentina-titular-2024',
  'Camiseta Argentina Titular 2024',
  'Selección Argentina', 'AFA', 'selecciones',
  38000.00, 45000.00,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home','Away'],
  ARRAY[
    'https://placehold.co/600x800/74ACDF/FFFFFF?text=argentina-titular-2024',
    'https://placehold.co/600x800/74ACDF/FFFFFF?text=argentina-titular-2024-back'
  ],
  'Camiseta de la Selección Argentina, campeona del mundo. Celeste y blanco, parche de campeón. Las tres estrellas que conquistaron Qatar 2022.',
  ARRAY[
    'Tecnología Dri-FIT ADV',
    'Escudo AFA bordado con 3 estrellas',
    'Parche oficial Campeón del Mundo',
    'Corte atlético championship',
    'Certificado de autenticidad'
  ],
  'New', true, 5.0, 428
),

-- 4. Argentina Tercera
(
  'argentina-tercera-2024',
  'Camiseta Argentina Tercera 2024',
  'Selección Argentina', 'AFA', 'selecciones',
  38000.00, NULL,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Third'],
  ARRAY[
    'https://placehold.co/600x800/5B2D8E/FFFFFF?text=argentina-tercera-2024',
    'https://placehold.co/600x800/5B2D8E/FFFFFF?text=argentina-tercera-2024-back'
  ],
  'Tercera camiseta de la Selección Argentina 2024. Color violeta exclusivo, edición limitada que se agota rápido. Un diseño único e icónico.',
  ARRAY[
    'Edición limitada coleccionable',
    'Color violeta exclusivo',
    'Escudo AFA bordado con 3 estrellas',
    'Tejido premium breathable',
    'Numerado y certificado'
  ],
  'Limited', true, 4.9, 203
),

-- 5. Real Madrid
(
  'real-madrid-titular-2025',
  'Camiseta Real Madrid Titular 2024/25',
  'Real Madrid', 'La Liga', 'europa',
  40000.00, 48000.00,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home','Away','Third'],
  ARRAY[
    'https://placehold.co/600x800/FFFFFF/003087?text=real-madrid-titular-2025',
    'https://placehold.co/600x800/FFFFFF/003087?text=real-madrid-titular-2025-back'
  ],
  'Camiseta oficial del Real Madrid temporada 2024/25. Blanco puro, tecnología Adidas HEAT.RDY para máximo rendimiento. Los campeones de Europa.',
  ARRAY[
    'Tecnología Adidas HEAT.RDY',
    'Escudo Real Madrid bordado oficial',
    'Blanco puro icónico',
    'Certificado de autenticidad',
    'Apto lavado a máquina'
  ],
  'Sale', true, 4.8, 247
),

-- 6. Barcelona
(
  'barcelona-titular-2025',
  'Camiseta Barcelona Titular 2024/25',
  'FC Barcelona', 'La Liga', 'europa',
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home','Away'],
  ARRAY[
    'https://placehold.co/600x800/A50044/FFFFFF?text=barcelona-titular-2025',
    'https://placehold.co/600x800/A50044/FFFFFF?text=barcelona-titular-2025-back'
  ],
  'Camiseta oficial del FC Barcelona 2024/25. Azulgrana clásico con detalles dorados. El Barça que vuelve a rugir en Europa.',
  ARRAY[
    'Tecnología Nike Dri-FIT ADV',
    'Escudo FC Barcelona bordado',
    'Azulgrana con detalles dorados',
    'Slim fit moderno',
    'Material reciclado 100%'
  ],
  'New', true, 4.7, 183
),

-- 7. Manchester City
(
  'manchester-city-titular-2025',
  'Camiseta Manchester City Titular 2024/25',
  'Manchester City', 'Premier League', 'europa',
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home','Away','Third'],
  ARRAY[
    'https://placehold.co/600x800/6CADDF/FFFFFF?text=manchester-city-titular-2025',
    'https://placehold.co/600x800/6CADDF/FFFFFF?text=manchester-city-titular-2025-back'
  ],
  'Camiseta del Manchester City 2024/25. Celeste cielo con detalles en blanco, Puma. El equipo de Guardiola que domina la Premier League.',
  ARRAY[
    'Tecnología Puma ULTRAWEAVE',
    'Escudo City bordado oficial',
    'Celeste Sky Blue icónico',
    'Regular fit performance',
    'Certificado OEKO-TEX'
  ],
  NULL, true, 4.6, 156
),

-- 8. PSG
(
  'psg-titular-2025',
  'Camiseta PSG Titular 2024/25',
  'Paris Saint-Germain', 'Ligue 1', 'europa',
  40000.00, NULL,
  ARRAY['S','M','L','XL','XXL'],
  ARRAY['Home','Away','Third'],
  ARRAY[
    'https://placehold.co/600x800/1C1C3C/E3051B?text=psg-titular-2025',
    'https://placehold.co/600x800/1C1C3C/E3051B?text=psg-titular-2025-back'
  ],
  'Camiseta del Paris Saint-Germain 2024/25. Azul marino con franja roja, Nike Dri-FIT. El Paris que seduce al mundo con su estilo único.',
  ARRAY[
    'Tecnología Nike Dri-FIT',
    'Escudo PSG bordado oficial',
    'Azul marino con franja roja',
    'Slim fit parisino',
    'Apto lavado a máquina'
  ],
  'New', true, 4.7, 134
)

ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- COUPONS
-- ============================================================
INSERT INTO coupons (code, type, value, active, uses) VALUES
  ('CARPI10',     'percent', 10, true,  47),
  ('CARPI20',     'percent', 20, true,  23),
  ('FOOTBALL',   'percent', 15, true,  31),
  ('BIENVENIDO', 'percent',  5, true,  89)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- REVIEWS  (linked to products by slug)
-- ============================================================
INSERT INTO reviews
  (product_id, reviewer_name, reviewer_initials, rating, text, verified, created_at)
VALUES
  (
    (SELECT id FROM products WHERE slug = 'racing-titular-2024'),
    'Martín Acuña', 'MA', 5,
    'La titular de Racing llegó perfecta, igual a la que usan en el Cilindro. El escudo bordado se ve espectacular y la tela es muy cómoda. ¡Aguante La Academia!',
    true, '2025-03-10 10:00:00+00'
  ),
  (
    (SELECT id FROM products WHERE slug = 'argentina-titular-2024'),
    'Valentina Cruz', 'VC', 5,
    'Pedí la Argentina para mi hermano y quedó re contento. La calidad es increíble, el parche de campeón y las tres estrellas se ven perfectas. 100% recomendado.',
    true, '2025-03-18 14:30:00+00'
  ),
  (
    (SELECT id FROM products WHERE slug = 'racing-alternativa-2024'),
    'Lucas Ferreiro', 'LF', 5,
    'La alternativa roja de Racing es una obra de arte. Me la puse para el clásico y todos me preguntaban dónde la compré. Llegó en dos días, impecable.',
    true, '2025-03-25 09:15:00+00'
  ),
  (
    (SELECT id FROM products WHERE slug = 'argentina-tercera-2024'),
    'Sofía Moreno', 'SM', 4,
    'La Argentina tercera violeta es una locura, diseño único. Llegó bien embalada y el talle M me quedó perfecto según la guía. Muy buena experiencia de compra.',
    true, '2025-04-02 16:45:00+00'
  ),
  (
    (SELECT id FROM products WHERE slug = 'real-madrid-titular-2025'),
    'Tomás Ibáñez', 'TI', 5,
    'Compré la del Real Madrid y es idéntica a la original. La textura de la tela y el acabado del escudo son de primera. Ya hice el segundo pedido con la del Barcelona.',
    true, '2025-04-15 11:20:00+00'
  ),
  (
    (SELECT id FROM products WHERE slug = 'barcelona-titular-2025'),
    'Camila Ríos', 'CR', 5,
    'Uso Carpi para comprar camisetas hace meses y nunca me fallaron. Siempre llegan antes de lo esperado y la calidad es impecable. Los mejores del rubro.',
    true, '2025-04-22 18:00:00+00'
  )
ON CONFLICT DO NOTHING;
