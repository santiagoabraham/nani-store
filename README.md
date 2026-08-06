# Nani Store

Plataforma de e-commerce **multi-tienda** para indumentaria deportiva. Un mismo código
hospeda varias tiendas independientes, aisladas entre sí por *tenant*: cada una con sus
productos, categorías, cupones, pedidos, credenciales de cobro y branding.

Construida con Next.js 14 (App Router), Supabase, TypeScript y TailwindCSS.

---

## Qué hace

### Vitrina

- **Catálogo con filtros derivados del catálogo real** — club, prenda, categoría, talle y
  rango de precio. Las opciones salen de los productos cargados, así que el filtro nunca
  ofrece algo que no existe ni esconde algo que sí.
- **Dos precios por producto** — el financiado en cuotas y el de contado con descuento por
  efectivo o transferencia, ambos derivados de un único precio de lista.
- **Checkout** con elección de envío (zona × modalidad), cupones y MercadoPago.
- **Control de stock** — un producto sin stock desaparece del catálogo y su URL directa
  devuelve 404.

### Panel de administración

- ABM de productos, con desplegable de ~450 clubes y selecciones que autocompleta la liga.
- ABM de categorías con visibilidad y orden: se ocultan en lugar de borrarse, para no
  perder los productos que cuelgan de ellas.
- **Cola de despacho** — pedidos cobrados que todavía no salieron, ordenados por antigüedad,
  con carga del número de seguimiento.
- Cupones, pedidos y configuración de la tienda (cuotas, descuento por efectivo, tarifas de
  envío) editables sin tocar código.

---

## Decisiones de diseño

**Los precios nunca vienen del navegador.** El cliente manda qué compra y a dónde lo envía;
el servidor busca los precios en la base y calcula el total. Un `shippingCost: 0` o un precio
adulterado en el request no tienen efecto.

**Aislamiento por tenant en la base, no en el código.** Row Level Security con funciones
`SECURITY DEFINER` garantiza que una tienda no pueda leer los datos de otra aunque la
aplicación se equivoque.

**Operaciones críticas atómicas.** La numeración de pedidos, el canje de cupones y las
transiciones de estado son RPCs de Postgres, no lecturas seguidas de escrituras. Los webhooks
de pago son idempotentes: MercadoPago reintenta, y reintentar no duplica nada.

**El costo de envío se congela en el pedido.** Subir las tarifas no reescribe lo que un
cliente ya pagó.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router, Server Components) |
| Base de datos y auth | Supabase (Postgres + RLS + Storage) |
| Lenguaje | TypeScript |
| Estilos | TailwindCSS |
| Estado del carrito | Zustand (una instancia aislada por tienda) |
| Cobros | MercadoPago (preferencias + webhooks firmados) |

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con las credenciales de tu proyecto Supabase
npm run dev
```

La aplicación queda en `http://localhost:3000`, que redirige a la tienda definida en
`DEFAULT_TENANT_SLUG`.

**Antes del primer arranque** hay que crear el esquema en Supabase y el bucket de Storage.
El paso a paso completo — incluidas las migraciones, que no son opcionales — está en
**[SETUP_GUIDE.md](SETUP_GUIDE.md)**.

> El archivo `.env.local` contiene la *service role key*, que saltea RLS por completo. Está
> en `.gitignore` y nunca debe versionarse.

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Alta del proyecto Supabase, migraciones, Storage, MercadoPago, deploy en Vercel |
| **[TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)** | Arquitectura multi-tenant, modelo de datos, modelo de seguridad, flujo de checkout, tipos |

---

## Estructura

```
app/
  [tenant]/
    layout.tsx          Resuelve el tenant. Nada más: lo comparten vitrina y panel
    (storefront)/       Route group — no aparece en la URL. Header, footer y carrito
    admin/              Fuera del group: no hereda la cáscara de la tienda
    api/                Rutas de API con alcance de tenant
components/             UI de vitrina, panel y componentes compartidos
lib/
  db/                   Acceso a datos, separado por audiencia (vitrina vs admin)
  pricing.ts            Derivación de precios en cuotas y contado
  shipping.ts           Zonas, modalidades y tarifas
  clubs.ts              Catálogo de clubes y selecciones
supabase/               Esquema, hardening de RLS y migraciones
```
