# Roadmap — Todo editable desde el panel

Objetivo fijado por el dueño de la tienda:

> *"Quiero que TODA la página sea fácilmente modificable desde el panel de administrador,
> no quiero que nada sea un mockup estático sin poder cambiarlo desde ese panel."*

El trabajo se dividió en tres tandas. **La tanda 1 está terminada.**

---

## Tanda 1 — Frenar las promesas falsas ✅

Lo urgente: la tienda anunciaba compromisos comerciales que nadie había configurado.

- [x] Tabla `store_perks` + sección **Contenido** en el panel (alta, edición, orden,
      mostrar/ocultar, borrado, selector de íconos y vista previa)
- [x] Barra de beneficios de la portada, editable
- [x] Bloques de confianza de la ficha de producto, editables
- [x] Imágenes del hero: subir, borrar y reordenar desde Configuración
- [x] Cupón del newsletter configurable + se creó `BIENVENIDO` de verdad
- [x] Nota de devoluciones desde Configuración

Migración: `supabase/migration-004-contenido-editable.sql`

> Las promesas que nunca se configuraron (envío gratis, soporte 24/7, devolución) quedaron
> sembradas **ocultas**. Aparecen en el panel listas para activar, pero la tienda no las
> anuncia hasta que alguien lo decida.

---

## Tanda 2 — Curaduría honesta

Hoy varias secciones afirman cosas que el dato no respalda.

### Productos destacados
Actualmente son `products.slice(0, 4)` — **los 4 más nuevos**, no una selección.

- [ ] Columna `products.featured BOOLEAN` + interruptor en el alta/edición de producto
- [ ] Interruptor rápido en la tabla de productos, como el de stock
- [ ] La home lee `featured = true`; si no hay ninguno, la sección no se dibuja

### Más vendidas
La sección no mide nada. **Decisión tomada: calcularlo de verdad.**

- [ ] Vista o RPC que sume `order_items.quantity` de pedidos con `status` cobrado
      (`paid`, `shipped`, `delivered`) agrupado por producto
- [ ] Ordenar por esa suma; con pocas ventas va a mostrar poco, y está bien
- [ ] Si no hay ventas suficientes, ocultar la sección en vez de rellenar con novedades

### Directo del perchero
`components/home/HangingRack.tsx:16` tiene un diccionario `RACK_IMAGES` con **5 slugs
escritos a mano**. Un producto que no esté ahí cae a `/logo.png`.

- [ ] Mover esa imagen a una columna del producto (`rack_image`) o a `images[1]` por convención
- [ ] Elegir qué productos van al perchero desde el panel, en vez de `slice(0, 5)`
- [ ] Sin selección, la sección no se dibuja

### Categorías
- [ ] "Próximamente" **automático**: que salga de no tener productos, no del flag manual
      `coming_soon`
- [ ] Subir la imagen de cada categoría desde el ABM (hoy el campo `image` existe sin UI)
- [ ] Verificar que el orden ya implementado se refleje en la grilla de la home

### Newsletter con club preferido
**Decisión tomada: tabla propia de suscriptores.**

- [ ] Tabla `subscribers` (email, club, fecha, tenant)
- [ ] Selector de club en el formulario, reutilizando `lib/clubs.ts`
- [ ] Pantalla en el panel para verlos y exportarlos a CSV

---

## Tanda 3 — Secciones editables

La home deja de ser un componente fijo y pasa a ser una **lista de secciones en la base**.

- [ ] Tabla `home_sections`: `type` (hero, perks, destacados, perchero, categorías,
      catálogo, reseñas, newsletter), `title`, `subtitle`, `visible`, `sort_order`
- [ ] La home itera esa lista y renderiza cada bloque en orden
- [ ] Pantalla "Secciones de la portada": mostrar/ocultar, reordenar con flechas y editar
      título y bajada de cada bloque — mismo patrón que Categorías y Contenido
- [ ] Los títulos hoy fijos en los componentes (`PRODUCTOS DESTACADOS`, `DESCOLGÁ LA TUYA`,
      `CATEGORÍAS`, `TODOS LOS PRODUCTOS`) pasan a esa tabla

---

## Descartado por ahora

**Editor visual con arrastrar y soltar sobre la página del cliente.** Se evaluó y se decidió
no hacerlo: es un proyecto en sí mismo (overlays de edición, modo preview, estado sin
guardar, permisos, casos raros en mobile) y cuesta más que las tres tandas juntas. La tanda 3
cubre el ~90% del beneficio con flechas y un interruptor de visibilidad, que además es el
patrón que el dueño ya sabe usar.

Se puede reconsiderar después de usar la tanda 3 un tiempo, ya sabiendo qué falta de verdad.

---

## Deuda conocida, sin relación con esto

- **`camisetas-carpi`** (el primer proyecto de Vercel) devuelve 500 por variables de entorno
  faltantes. El sitio bueno es `camisetas-carpi-v2`. Falta borrarlo o arreglarlo.
- **El SMTP integrado de Supabase topea en 2 mails/hora** y no es configurable. La
  recuperación de contraseña funciona pero es inusable en producción hasta conectar un
  proveedor propio (Resend) en Authentication → Emails.
- **`email_from` se expone en el HTML de todas las páginas**, incluida la tienda pública,
  porque `TenantProvider` serializa el objeto de settings completo hacia el cliente. Hoy es
  un mail personal. Conviene o cambiarlo por uno de la tienda, o dejar de mandar ese campo
  al navegador.
