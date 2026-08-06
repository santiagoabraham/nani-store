# Technical Documentation — camisetas-carpi

Multi-tenant e-commerce platform for sports jerseys. Built with Next.js 14 App Router, Supabase, TypeScript, Zustand, and TailwindCSS. Designed to host multiple independent stores from a single codebase. Each store is fully isolated by tenant.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Multi-Tenant Architecture](#2-multi-tenant-architecture)
3. [Data Flow](#3-data-flow)
4. [Supabase Usage](#4-supabase-usage)
5. [API Routes](#5-api-routes)
6. [Security Model](#6-security-model)
7. [Checkout & Payment Flow](#7-checkout--payment-flow)
8. [File Upload System](#8-file-upload-system)
9. [State Management](#9-state-management)
9b. [Catalog Model](#9b-catalog-model)
10. [Environment Variables](#10-environment-variables)
11. [Key Types](#11-key-types)
12. [SQL Files](#12-sql-files)

---

## 1. Project Structure

```
camisetas-carpi/
├── app/
│   ├── layout.tsx                        # Root HTML shell
│   ├── page.tsx                          # Redirects / → /{DEFAULT_TENANT_SLUG}
│   ├── not-found.tsx
│   ├── globals.css
│   ├── platform/
│   │   └── page.tsx                      # /platform — tenant directory
│   ├── [tenant]/                         # All tenant-scoped routes
│   │   ├── layout.tsx                    # ONLY TenantContext — no storefront chrome
│   │   ├── (storefront)/                 # Route group: does NOT appear in the URL
│   │   │   ├── layout.tsx                # CartStoreProvider + Header/Footer/CartDrawer
│   │   │   ├── page.tsx                  # Store homepage
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # Products listing
│   │   │   │   └── [slug]/page.tsx       # Product detail
│   │   │   └── checkout/
│   │   │       ├── page.tsx              # Shipping + payment selection
│   │   │       └── success/page.tsx      # Post-payment confirmation
│   │   ├── admin/                        # Outside (storefront): no Header/Footer/cart
│   │   │   ├── layout.tsx                # Admin shell + Sidebar
│   │   │   ├── page.tsx                  # Dashboard (KPIs)
│   │   │   ├── login/page.tsx            # Login form (useFormState)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # Products table
│   │   │   │   ├── new/page.tsx          # Create product
│   │   │   │   └── [id]/edit/page.tsx    # Edit product
│   │   │   ├── categories/page.tsx       # Category CRUD + show/hide + reorder
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx              # Orders list
│   │   │   │   └── [id]/page.tsx         # Order detail + status update
│   │   │   ├── dispatch/page.tsx         # Dispatch queue (paid, not yet shipped)
│   │   │   ├── coupons/page.tsx          # Coupon CRUD
│   │   │   └── settings/page.tsx         # Store settings
│   │   └── api/
│   │       ├── orders/
│   │       │   ├── route.ts              # POST: create order
│   │       │   └── [id]/
│   │       │       ├── route.ts          # PATCH: update status (admin)
│   │       │       └── ship/route.ts     # POST: dispatch + tracking (admin)
│   │       ├── products/
│   │       │   ├── route.ts              # POST: create product (admin)
│   │       │   └── [id]/
│   │       │       ├── route.ts          # PATCH/DELETE: update/delete product (admin)
│   │       │       └── stock/route.ts    # PATCH: toggle stock (admin)
│   │       ├── categories/
│   │       │   ├── route.ts              # POST: create category (admin)
│   │       │   └── [id]/route.ts         # PATCH/DELETE: update/delete category (admin)
│   │       ├── coupons/
│   │       │   ├── route.ts              # POST: create coupon (admin)
│   │       │   ├── [id]/route.ts         # PATCH/DELETE: update/delete coupon (admin)
│   │       │   └── validate/route.ts     # POST: validate coupon (public)
│   │       ├── settings/route.ts         # PATCH: update store settings (admin)
│   │       └── webhooks/
│   │           └── mercadopago/route.ts  # POST: MP payment webhooks
│   └── api/
│       └── upload/route.ts               # POST: image upload (admin auth)
├── components/
│   ├── layout/
│   │   ├── Header.tsx                    # Navbar with cart icon
│   │   ├── CartDrawer.tsx                # Sliding cart sidebar
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── Hero.tsx                      # Hero section with carousel
│   │   ├── CategoryGrid.tsx              # Category cards
│   │   ├── FeaturedProducts.tsx
│   │   ├── AllProducts.tsx
│   │   ├── Reviews.tsx                   # Static testimonials
│   │   └── Newsletter.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetailClient.tsx       # Size/version selectors, add-to-cart
│   │   ├── ProductsClient.tsx            # Client-side filter/sort
│   │   ├── ProductFilters.tsx            # Filter sidebar
│   │   ├── SizeSelector.tsx
│   │   └── VersionSelector.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx                   # Admin navigation
│   │   ├── ProductsTable.tsx             # Products list with inline actions
│   │   ├── TenantProductForm.tsx         # Create/edit product form
│   │   ├── CategoriesManager.tsx         # Category CRUD, visibility toggle, ordering
│   │   ├── DispatchQueue.tsx             # Pending shipments + tracking entry
│   │   ├── OrderStatusUpdater.tsx        # Status dropdown (calls PATCH /api/orders/[id])
│   │   ├── CouponsManager.tsx            # Coupon CRUD interface
│   │   └── StoreSettingsForm.tsx         # Settings form (calls PATCH /api/settings)
│   ├── analytics/
│   │   └── PageTracker.tsx               # Client: scroll/time tracking
│   └── ui/
│       ├── Button.tsx                    # variants: primary|outline|ghost|dark
│       ├── Badge.tsx
│       ├── StarRating.tsx
│       └── HeroCarousel.tsx
├── context/
│   └── TenantContext.tsx                 # Provides Tenant + StoreSettings
├── store/
│   └── cartStore.tsx                     # Per-tenant Zustand cart (localStorage)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser client (anon key)
│   │   └── server.ts                     # Server client + service client
│   ├── db/
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── coupons.ts
│   │   └── settings.ts
│   ├── auth/
│   │   └── adminAuth.ts                  # Server Action: login/logout/getAdminUser
│   ├── api-utils.ts                      # withAdmin/withTenant HOFs, ApiError
│   ├── tenant.ts                         # getTenantBySlug, getMpAccessToken, etc.
│   ├── clubs.ts                          # ~450 clubs/national teams grouped by league
│   ├── garments.ts                       # GARMENT_TYPES (Camisetas, Buzos, …)
│   ├── pricing.ts                        # Instalment + cash-discount derivation
│   ├── shipping.ts                       # Zones, methods, rate lookup
│   ├── analytics.ts                      # Event tracking helpers
│   ├── utils.ts                          # cn(), formatPriceARS(), slugify(), getRatingStars()
│   └── data.ts                           # Legacy fixtures — only `reviews` is still imported
├── types/
│   └── index.ts                          # All shared types
├── supabase/
│   ├── schema-multitenancy.sql           # Full schema (tables, indexes, RLS)
│   ├── security-hardening.sql            # REVOKE SELECT on store_settings, views, claim_coupon RPC
│   ├── rls-hardening.sql                 # SECURITY DEFINER helpers, INSERT lock, order sequence
│   ├── migration-002-garment-categories.sql  # garment_type, categories.visible
│   ├── migration-003-pagos-envios.sql    # Instalments, cash discount, shipping, tracking
│   └── seed-multitenancy.sql             # Demo data
├── middleware.ts                         # Root redirect, legacy redirects, admin auth guard
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## 2. Multi-Tenant Architecture

### Routing

Every store is accessed via `/{tenantSlug}/`. The tenant slug is the first path segment.

```
/my-store/                     → Camisetas Carpi store homepage
/my-store/products             → Camisetas Carpi product catalog
/my-store/checkout             → Camisetas Carpi checkout
/my-store/admin/products       → Camisetas Carpi admin panel
/otra-tienda/              → Different store, completely isolated
```

`middleware.ts` redirects:
- `/` → `/{DEFAULT_TENANT_SLUG}` (env var, default `my-store`)
- `/products/*`, `/checkout/*`, `/admin/*` → `/{DEFAULT_TENANT}/...` (legacy redirect)

### Layout split: storefront vs admin

`app/[tenant]/layout.tsx` runs for **both** the storefront and the admin panel, so it must
stay minimal — it only resolves the tenant and publishes it through `TenantContext`.

The storefront chrome (`Header`, `Footer`, `CartDrawer`, `CartStoreProvider`) lives one level
down in `app/[tenant]/(storefront)/layout.tsx`. `(storefront)` is a route group: the
parentheses are stripped from the URL, so `/{tenant}` and `/{tenant}/products` are unchanged,
but `/{tenant}/admin` sits **outside** the group and therefore never inherits it.

Do not move `Header`/`Footer` back up into `app/[tenant]/layout.tsx`. The header is
`position: fixed`, so putting it there renders the storefront navbar pinned over the admin
dashboard.

**Route groups do not add a URL segment.** `app/(platform)/page.tsx` resolved to `/`, exactly
like `app/page.tsx` — two pages for one route. `next build` tolerated it locally and emitted a
single `/`, but the Vercel build failed with:

```
ENOENT: lstat '.next/server/app/(platform)/page_client-reference-manifest.js'
```

That manifest is only emitted for pages that import at least one client component. The
platform page was pure server-side, so it never got one, while the build still expected it for
the grouped route. It was moved to `app/platform/` — a real segment, no collision. Before
adding a route group, check that no other file already resolves to the same path.

The header's height (`h-24`), the spacer div it renders underneath itself, and the hero's
`h-[calc(100svh-6rem)]` are three coupled values. Changing one without the others either
leaves a gap under the navbar or pushes the hero below the fold.

### Tenant Resolution

Every page/API route resolves the tenant exactly once at the entry point:

```typescript
// In page.tsx (Server Component):
const { tenant, settings } = await requireTenant(params.tenant)  // notFound() if missing

// In API route handlers (public):
const { tenant, settings } = await getTenantFromRequest(params.tenant)  // throws ApiError(404)

// In API route handlers (admin, via HOF):
export const POST = withAdmin(async (req, { tenant, settings, params }) => { ... })
```

`getTenantBySlug()` fetches from the `tenants` table joined with `store_settings_public` view.

### Data Isolation

Two complementary layers:

1. **Application layer** — Every DB query explicitly filters by `tenant_id`:
   ```typescript
   .from('products').select('*').eq('tenant_id', tenant.id)
   ```

2. **Database layer (RLS)** — PostgreSQL policies enforce `tenant_id = current_user_tenant_id()` via a `SECURITY DEFINER` helper function that prevents recursive policy evaluation.

### Context Injection

`app/[tenant]/layout.tsx` (Server Component) fetches tenant data once and passes it down:

```
TenantProvider (server data: Tenant + StoreSettings)
  └── CartStoreProvider (one Zustand store per tenantSlug)
        └── Page components
              ├── useTenant()  → tenant + settings
              └── useCart()    → cart state + actions
```

Sensitive fields (`mp_access_token`, `mp_webhook_secret`) never reach `TenantContext`. They are fetched server-side only when needed via `getMpAccessToken()` / `getMpWebhookSecret()`.

---

## 3. Data Flow

### Public Store Page

```
Browser → GET /[tenant]
  → middleware: passes (public route)
  → app/[tenant]/layout.tsx: requireTenant() → TenantContext
  → app/[tenant]/page.tsx: getProductsByTenant(), getCategoriesByTenant()
  → Server renders HTML with tenant-specific data
  → Client hydrates with CartStoreProvider
```

### Guest Checkout

```
Browser → POST /[tenant]/api/orders
  Body: { customer, items: [{productId, size, version, quantity}], paymentMethod, discountCode }

  Server:
    1. getTenantFromRequest()              — resolve + validate tenant
    2. getProductsByIds(ids, tenant.id)   — server-side price lookup from DB
    3. claimCoupon() RPC                  — atomic validate + increment (if code given)
    4. createOrder():
         next_order_number_for_tenant()   — per-tenant sequence ("CC-0001")
         INSERT orders (service client)
         INSERT order_items (service client)
    5. [MP only] createMpPreference() → MP API
         external_reference: order.id
         notification_url: /[tenant]/api/webhooks/mercadopago
       → returns init_point
    6. Return { order, mpInitPoint? }

  Client: redirect to mpInitPoint (MP checkout)
```

### Admin Data Mutation

```
Admin browser → PATCH /[tenant]/api/products/[id]
  Cookie: Supabase auth session

  withAdmin() HOF:
    1. getTenantBySlug(params.tenant)         — resolve tenant
    2. getAdminUser(tenant.id)
         supabase.auth.getUser()              — live JWT validation
         profiles WHERE id=uid AND tenant_id=tenant.id AND role='admin'
    3. updateProduct(id, tenant.id, data)     — createClient() (session-scoped)
    4. Return { product }
```

---

## 4. Supabase Usage

### Clients

| Client | Import From | Key | RLS | Use Cases |
|--------|-------------|-----|-----|-----------|
| `createClient()` (browser) | `lib/supabase/client.ts` | anon | enforced | Client-side auth state |
| `createClient()` (server) | `lib/supabase/server.ts` | anon | enforced | Server Components, admin mutations |
| `createServiceClient()` | `lib/supabase/server.ts` | service_role | **bypassed** | Order creation, coupon claims, settings writes, webhooks |

**Rule:** `createServiceClient` is only imported in `lib/db/*`, `lib/tenant.ts`, and route handlers. Never in `'use client'` components.

### Database Tables

| Table | Key Columns | RLS Notes |
|-------|-------------|-----------|
| `tenants` | id, slug (unique) | Public read |
| `store_settings` | tenant_id (PK), mp_access_token\*, mp_webhook_secret\*, `installments`, `cash_discount_percent`, `ship_*` | SELECT revoked from anon/authenticated |
| `store_settings_public` (VIEW) | All columns except secrets | GRANT SELECT to anon, authenticated |
| `categories` | id, tenant_id, slug, `visible`, sort_order | Read: own tenant. Write: admins |
| `products` | id, tenant_id, slug, `garment_type` | Read: any. Write: admins |
| `profiles` | id (FK auth.users), tenant_id, role | Read/update: own row |
| `orders` | id, tenant_id, number, payment_id, status, `shipping_*`, `tracking_number`, `shipped_at` | **INSERT revoked** from anon/authenticated |
| `order_items` | order_id, product_id | **INSERT revoked** from anon/authenticated |
| `coupons` | tenant_id, code, type, uses | Read: authenticated own tenant; service for anon |

\* Never included in `StoreSettings` type or `store_settings_public` view.

**Adding a column to `store_settings` that the storefront needs to read:** it must also be
appended to the `store_settings_public` view, otherwise `getTenantBySlug()` never sees it.
`CREATE OR REPLACE VIEW` only allows **appending** columns at the end of the select list —
it cannot reorder or retype existing ones — and it silently drops the view's grants, so
`GRANT SELECT ON store_settings_public TO anon, authenticated;` must follow every rebuild.

**Constrained columns.** `orders.payment_method` has a `CHECK` accepting
`mercadopago | card | stripe | cash`. `orders.shipping_method` accepts `domicilio | sucursal`
and `orders.shipping_zone` accepts `caba_gba | resto`. Adding a new payment or shipping option
in TypeScript alone produces a Postgres `23514` at insert time — the CHECK has to be widened
in the same change.

### RLS Helper Functions (SECURITY DEFINER)

```sql
current_user_tenant_id()         -- Returns auth.uid()'s tenant_id from profiles
is_admin_for(check_tenant_id)    -- Returns true if auth.uid() is admin for that tenant
```

Both are `SECURITY DEFINER` to avoid recursive RLS evaluation when policies query the `profiles` table.

### RPC Functions

| Function | Purpose | Caller |
|----------|---------|--------|
| `next_order_number_for_tenant(p_tenant_id, p_prefix)` | Atomic per-tenant order counter | service client |
| `claim_coupon(p_code, p_tenant_id)` | Atomic validate + increment coupon uses | service client |
| `transition_order_status(p_order_id, p_tenant_id, p_new_status, p_payment_id)` | Idempotent, forward-only status machine | service client |

### Auth

- **Session management:** `@supabase/ssr` manages HttpOnly cookies
- **Admin login:** `supabase.auth.signInWithPassword()` → role check in `profiles`
- **Session validation:** `supabase.auth.getUser()` (validates JWT server-side on every request)
- **Why not `getSession()`:** `getSession()` reads the local cookie only — a revoked user would still pass for the remaining JWT lifetime

### Password Recovery

`ForgotPassword` (on the login page) calls `resetPasswordForEmail` **from the browser**, and
`/{tenant}/admin/reset-password` receives the token. Three things make this work, each of
which broke it while being built:

1. **The reset route is excluded from the middleware admin guard** (alongside `login`). It is
   reached *without* a session — the token has not been redeemed when middleware runs — so
   guarding it made the emailed link bounce to the login screen.

2. **The session is installed manually, not auto-detected.** `createBrowserClient` from
   `@supabase/ssr` is built for the PKCE-over-cookies flow and does **not** consume
   implicit-flow tokens from the URL hash. Relying on `detectSessionInUrl` left the page
   spinning with a perfectly valid token in the address bar. The page parses the hash and
   calls `setSession({ access_token, refresh_token })` explicitly, then clears the hash with
   `history.replaceState` so the tokens do not linger in the URL or browser history. The
   `?code` (PKCE) path is still handled first, in case the project is reconfigured.

3. **Redirect URLs must be allow-listed in Supabase.** Authentication → URL Configuration →
   Redirect URLs. If the requested `redirectTo` is not on that list, Supabase silently
   discards it and falls back to the Site URL — the link lands on `/` instead of the reset
   page, with the token in the hash and nothing to consume it.

The **built-in Supabase SMTP is capped at 2 emails/hour** and the limit is not editable.
That is a shared pool for every auth email. Recovery is unusable in production until a custom
SMTP provider is configured under Authentication → Emails.

To issue a recovery link without sending mail (bypassing the cap), use
`POST /auth/v1/admin/generate_link` with the service role key. `redirect_to` goes at the
**top level** of the payload — nesting it under `options` (the JS-client shape) makes the
REST endpoint ignore it and fall back to the Site URL.

`/{tenant}/admin/login` is a Server Component that redirects to `/{tenant}/admin` when a
valid session already exists. Without it, an authenticated admin landing on the login URL got
the admin sidebar rendered around the login form, which looks exactly like an auth bypass.
`reset-password` deliberately does *not* redirect that way — there, the recovery session is
what authorises the password change.

### Storage

- **Bucket name:** `products` (public bucket — images served via CDN URL)
- **Path pattern:** `{tenantId}/{sanitized-name}-{timestamp}.{ext}`
- **Write access:** Only via `POST /api/upload` (admin-authenticated service client)
- **Read access:** Public URL — no auth required to view images
- **Bucket config:** 5 MB limit, MIME whitelist `image/jpeg|png|webp|gif`

> **The bucket is not created by any SQL file.** It has to exist in the Supabase project
> before the first upload, and a fresh project starts with zero buckets. When it is missing,
> `POST /api/upload` returns 500 with a Supabase "Bucket not found" error. Create it from the
> dashboard, or over the Storage API:
>
> ```bash
> curl -X POST "$SUPABASE_URL/storage/v1/bucket" \
>   -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
>   -H "Content-Type: application/json" \
>   -d '{"id":"products","name":"products","public":true,"file_size_limit":5242880,
>        "allowed_mime_types":["image/jpeg","image/png","image/webp","image/gif"]}'
> ```

---

## 5. API Routes

### Public Routes

| Method | Path | Auth | What it does |
|--------|------|------|--------------|
| `POST` | `/[tenant]/api/orders` | None | Create order. Server-side price lookup + atomic coupon claim + optional MP preference creation |
| `POST` | `/[tenant]/api/coupons/validate` | None | Read-only coupon check — no side effects, no use increment |
| `POST` | `/[tenant]/api/webhooks/mercadopago` | HMAC + timestamp | Receive MP events → transition order status |
| `POST` | `/api/upload` | Session (admin) | Upload image → Supabase Storage |

### Admin Routes (session required + role='admin' for tenant)

| Method | Path | What it does |
|--------|------|--------------|
| `POST` | `/[tenant]/api/products` | Create product |
| `PATCH` | `/[tenant]/api/products/[id]` | Update product fields |
| `DELETE` | `/[tenant]/api/products/[id]` | Delete product |
| `PATCH` | `/[tenant]/api/products/[id]/stock` | Toggle `in_stock` flag |
| `POST` | `/[tenant]/api/coupons` | Create coupon |
| `PATCH` | `/[tenant]/api/coupons/[id]` | Update coupon (code, type, value, active, max_uses) |
| `DELETE` | `/[tenant]/api/coupons/[id]` | Delete coupon |
| `PATCH` | `/[tenant]/api/orders/[id]` | Update order status |
| `POST` | `/[tenant]/api/orders/[id]/ship` | Dispatch: set `shipped`, store tracking, stamp `shipped_at` |
| `POST` | `/[tenant]/api/categories` | Create category (slug derived from name) |
| `PATCH` | `/[tenant]/api/categories/[id]` | Rename / toggle `visible` / reorder |
| `DELETE` | `/[tenant]/api/categories/[id]` | Delete — refuses (409) if the category still has products |
| `PATCH` | `/[tenant]/api/settings` | Update store settings and/or MP credentials |

### Route file constraint

Next.js validates the exports of every `route.ts`. Only handlers (`GET`, `POST`, …) and the
documented route config may be exported — adding a helper `export function` there fails the
build with a type error. Shared helpers belong in `lib/` (e.g. `slugify` lives in `lib/utils.ts`).

### Route Wrappers (`lib/api-utils.ts`)

```typescript
withAdmin(handler)
// 1. Resolve tenant by slug (404 if not found)
// 2. Validate admin session + tenant ownership (401 if not authorized)
// 3. Call handler(req, { tenant, settings, params })
// 4. Catch ApiError → JSON response with correct status code

withTenant(handler)
// Same but skips admin check — used for public but tenant-scoped operations
```

---

## 6. Security Model

### RLS Policy Summary

- **Orders / order_items:** `INSERT` privilege revoked from `anon` and `authenticated` at the PostgreSQL privilege level — bypasses RLS evaluator entirely. All creation goes through `createServiceClient()` after server-side price verification.
- **Coupons:** Read restricted to `current_user_tenant_id()` match. Service client used for anonymous checkout validation.
- **Store settings:** `SELECT` revoked from `anon` and `authenticated`. Public data accessible only via `store_settings_public` view.
- **Products:** Anyone can read. Writes require `is_admin_for(tenant_id)`.

### Service Role Scope

`createServiceClient()` is used only when:
1. The operation requires bypassing RLS (order creation, settings writes)
2. The caller has no Supabase session (webhook handler, guest checkout)

All calls are server-side only. The service role key is never sent to the browser.

### Admin Authorization (Defense in Depth)

```
Middleware (edge):
  getUser() → redirect to /admin/login if no session

Route handler (withAdmin HOF):
  getAdminUser(tenant.id):
    getUser() → validates JWT live
    profiles WHERE id=uid AND tenant_id=tenant.id AND role='admin'
    → 401 if any check fails

Database (RLS):
  is_admin_for(tenant_id) on write operations
  → rejects even if app layer somehow passed
```

Three independent enforcement points. A user authenticated for tenant A cannot affect tenant B's data through any path.

### Webhook Security

```
1. HMAC-SHA256: signed message = "id:{paymentId};request-id:{uuid};ts:{epoch}"
   Compared with timingSafeEqual() — prevents timing oracle attacks

2. Timestamp window: |now - ts| > 300s → 401
   Prevents replay attacks (replayed webhooks rejected after 5 minutes)

3. MP API verification: fetch payment using THIS tenant's mp_access_token
   A fake paymentId returns 404 from MP → silently ignored
   A real payment from tenant B's MP account → returns 404 with tenant A's token

4. Cross-tenant order check: getOrderById(orderId, tenant.id)
   Filters by BOTH id AND tenant_id
   A spoofed external_reference pointing to another tenant's order returns null

5. Idempotent transitions: transition_order_status() uses FOR UPDATE row lock
   Duplicate webhooks for the same payment are safe (returns TRUE without re-writing)

6. Always return 200: MP retries on non-2xx → catch-all returns 200 even on errors
```

### Price Integrity

`OrderRequest` (client payload) contains `productId + quantity` only — never prices. The server calls `getProductsByIds(ids, tenant.id)` to look up current DB prices before building the `CreateOrderPayload`. Client-supplied prices are never used.

### File Upload Security

```
1. supabase.auth.getUser() → authenticated
2. profiles.role === 'admin' AND profiles.tenant_id is set
3. MIME type whitelist: jpeg, png, webp, gif
4. Magic byte validation — file content checked, not just Content-Type header
5. Filename sanitized to [a-z0-9-] + timestamp (no path traversal possible)
6. Storage path: {tenantId}/{filename} — tenant isolation in namespace
7. upsert: false — cannot overwrite existing files
```

---

## 7. Checkout & Payment Flow

### Order Creation Request (`OrderRequest`)

```typescript
// What the browser sends — no prices, no tenant info
{
  customer: { name, email, phone, address, city, state, zip, country },
  items: [{ productId, size, version, quantity }],
  paymentMethod: 'mercadopago' | 'card' | 'cash',
  discountCode: string | null,
  // Zone and method only — never the shipping price
  shipping: { zone: 'caba_gba' | 'resto', method: 'domicilio' | 'sucursal' }
}
```

The client sends the shipping *selection*, never the shipping *cost*. The cost is looked up
server-side from `store_settings`, for the same reason product prices are: a client-supplied
figure could be forged to zero.

### Server Processing (`POST /[tenant]/api/orders`)

```
1. Resolve tenant from URL slug
2. getProductsByIds(ids, tenant.id) → current DB prices
3. Validate shipping.zone / shipping.method (400 if missing or unknown)
   shippingCost(settings, zone, method) → rate from store_settings
4. if discountCode: claimCoupon() RPC → validates + atomically increments uses
5. if paymentMethod === 'cash': discount += cashDiscountAmount(subtotal - couponDiscount)
6. total = (subtotal - discount) + shippingCost
7. Build CreateOrderPayload with server-verified prices
8. createOrder():
     a. next_order_number_for_tenant() → "PREFIX-0001"
     b. INSERT orders (service client) — freezes shipping_cost on the row
     c. INSERT order_items (service client)
9. if mercadopago:
     a. getMpAccessToken(tenant.id) → from store_settings (service client)
     b. POST https://api.mercadopago.com/checkout/preferences
          external_reference: order.id
          items: [...lineItems, shipping as its own item if cost > 0]
          payment_methods: { installments, default_installments }
          back_urls.success: {request origin}/{tenant}/checkout/success?order={id}
          notification_url: {request origin}/{tenant}/api/webhooks/mercadopago
     c. Return { order, mpInitPoint: preference.init_point }
10. Client redirects to mpInitPoint
```

### Pricing rules (`lib/pricing.ts`)

Both prices derive from a single list price (`products.price`) plus two global settings, so
the product page, the checkout and the server can never disagree.

| Setting | Column | Meaning |
|---------|--------|---------|
| Instalments | `store_settings.installments` | Instalment count offered in MercadoPago |
| Cash discount | `store_settings.cash_discount_percent` | % off for `payment_method = 'cash'` |

- `products.price` **is** the instalment price — "3 cuotas sin interés" means no surcharge,
  so the financed total equals the list price.
- The cash discount applies to merchandise **after** any coupon, and **never** to shipping.
- Only `paymentMethod === 'cash'` (efectivo *or* transferencia) qualifies.

> **`installments` only caps the instalment count shown in MercadoPago's checkout.** It does
> not make them interest-free — that depends on the seller's active instalment campaign in
> their MercadoPago account. Without one, buyers see N instalments *with* interest.

### Shipping rules (`lib/shipping.ts`)

Rates are a 2×2 matrix of zone × method, all four stored in `store_settings` and editable
from the admin panel:

| | `domicilio` | `sucursal` |
|---|---|---|
| `caba_gba` | `ship_home_caba` | `ship_branch_caba` |
| `resto` | `ship_home_rest` | `ship_branch_rest` |

These are provisional flat rates standing in for live Correo Argentino quoting. When that
lands, `shippingCost()` is the only function that changes — order creation, the dispatch
queue and tracking all keep working, because each order stores its own frozen `shipping_cost`.
Raising the rates never rewrites historical orders.

Storefront copy that quotes shipping prices (the product page's "Envíos y devoluciones"
panel) reads them from `settings`, not from hardcoded strings, so the panel follows the
admin values automatically.

### Dispatch queue

`getOrdersToDispatch()` selects `status = 'paid' AND shipped_at IS NULL`, oldest first —
orders that are paid for but haven't left yet. `pending` orders aren't packed (not paid),
and `shipped` ones already left.

`POST /[tenant]/api/orders/[id]/ship` sets `status = 'shipped'`, stores the tracking number
and stamps `shipped_at`. Calling it again on an already-dispatched order only corrects the
tracking number and leaves `shipped_at` untouched, so a typo fix doesn't falsify the
dispatch date.

### MercadoPago Webhook (`POST /[tenant]/api/webhooks/mercadopago`)

```
MP Server → POST /[tenant]/api/webhooks/mercadopago
  body: { type: 'payment', data: { id: paymentId } }

  1. Resolve tenant
  2. [if mp_webhook_secret set] Verify HMAC signature + timestamp
  3. Fetch payment from MP API: GET /v1/payments/{paymentId}
       Authorization: Bearer {tenant.mp_access_token}
  4. payment.external_reference → order UUID
  5. getOrderById(orderId, tenant.id) → verifies order belongs to this tenant
  6. payment.status === 'approved' → markOrderPaid() RPC
     payment.status in ['rejected','cancelled','refunded'] → markOrderCancelled() RPC
  7. Return 200 (always — MP retries on non-2xx)
```

### Order Status Machine

```
pending → paid → shipped → delivered
pending → cancelled
paid    → cancelled
```

`transition_order_status()` RPC enforces this — backward transitions are rejected silently.

### Success Page

`/[tenant]/checkout/success?order={uuid}&pending=1`

Server Component fetches order via `getOrderById(orderId, tenant.id)`. Shows confirmed state or pending payment notice.

---

## 8. File Upload System

**Endpoint:** `POST /api/upload` (global — not tenant-scoped in URL, but tenant-scoped by session)

**Full validation chain:**

```
1. getUser() → must be authenticated
2. profiles WHERE id=uid → must have role='admin' AND tenant_id IS NOT NULL
3. formData.get('file') → file must be present and non-empty
4. file.type in ['image/jpeg','image/png','image/webp','image/gif']
5. validateMagicBytes(buffer, file.type) → content matches declared type
6. Sanitize filename: lowercase, strip non-[a-z0-9], truncate to 60 chars, append -timestamp
7. Upload path: {tenantId}/{filename} (service client, upsert: false)
8. Return { url: publicUrl }
```

**Magic byte signatures checked:**
- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47 0D 0A 1A 0A`
- WebP: `52 49 46 46 ?? ?? ?? ?? 57 45 42 50`
- GIF: `47 49 46 38 (37|39) 61`

---

## 9. State Management

### Cart Store (`store/cartStore.tsx`)

Context-based factory — one isolated Zustand store instance per tenant per browser tab.

```typescript
// Wrap in layout:
<CartStoreProvider tenantSlug={params.tenant}>{children}</CartStoreProvider>

// Use in any client component:
const { items, addItem, removeItem, updateQuantity,
        applyValidatedCoupon, removeCoupon, clearCart,
        getSubtotal, getDiscount, getTotal, getItemCount,
        isOpen, openCart, closeCart } = useCart()
```

**Persistence:** `localStorage` key `cart-{tenantSlug}`. Persisted fields: `items`, `couponCode`, `discountPercent`. `isOpen` is not persisted.

**Coupon handling:** `POST /[tenant]/api/coupons/validate` returns a preview. `applyValidatedCoupon(code, discountPercent)` saves it to store state. At order creation, the coupon is re-validated and atomically claimed server-side — the client's cached discount is not trusted.

### Tenant Context (`context/TenantContext.tsx`)

Read-only context populated once by `app/[tenant]/layout.tsx` (Server Component). All client components in the `[tenant]` subtree can call `useTenant()` to access `Tenant` and `StoreSettings` without additional fetches.

Because that layout wraps the admin panel too, admin client components can also call
`useTenant()` — but they don't need `useCart()`, which is only provided inside `(storefront)`.

---

## 9a. Editable Content

**Principle: nothing the customer reads may live in a component.** Text, images, icons and
ordering belong in the database and are edited from the admin panel. A hardcoded array in a
storefront component is debt from day one.

This is not only about convenience. The storefront was advertising *free shipping*, *30-day
returns*, *24/7 support* and a `BIENVENIDO` coupon — none of which the owner had configured,
and the coupon did not exist in the `coupons` table at all, so anyone who tried it was
rejected at checkout. The app was making commercial promises on the owner's behalf.

### Perks (`store_perks`)

| Column | Notes |
|--------|-------|
| `location` | `home` (bar under the hero) or `product` (trust badges on the detail page) |
| `icon` | Icon **name**, resolved through `lib/icons.ts` |
| `label` / `sublabel` | Free text |
| `visible` | Hidden keeps the row and its text; the storefront query filters on it |
| `sort_order` | Reordered with arrows in the panel |

One table serves both placements — `location` is the discriminator. Managed under
**Contenido** in the admin sidebar.

**Icons are a curated registry, not all of lucide-react.** `lib/icons.ts` maps ~24 names to
components. Dynamically importing the whole icon library would ship hundreds of kB to the
client for icons nobody uses. Adding one is a single line; `iconFor()` falls back to a default
so a stale name in the database never crashes a page.

**Responsive is a rendering concern, not a data one.** Both placements size their grid from
the actual number of visible perks (1/2/3/4 columns), and a placement with none renders
*nothing at all* rather than an empty strip. That is what makes deleting a block safe.

### Other settings-driven content

| Field | Replaces |
|-------|----------|
| `carousel_images` | Hero slides. The column always existed; Tanda 1 added the upload/reorder UI |
| `newsletter_coupon_code` | The hardcoded `BIENVENIDO`. `null` ⇒ the newsletter promises no coupon |
| `returns_note` | "Devoluciones gratis dentro de los 30 días". Empty ⇒ the line is not rendered |

Anything that reads as a commercial commitment must come from configuration, and must
degrade to *silence* when unset — never to a default promise.

---

## 9b. Catalog Model

A product is classified along three independent axes. They are not interchangeable:

| Axis | Column | Source of values | Editable by the store owner |
|------|--------|------------------|------------------------------|
| Category | `category_id` → `categories` | Per-tenant DB rows | Yes — admin panel |
| Garment type | `garment_type` | `GARMENT_TYPES` in `lib/garments.ts` | No — code constant |
| Club | `team` (+ `league`) | `CLUB_GROUPS` in `lib/clubs.ts` | Free text fallback |

A jersey and a hoodie can both sit in the category "Equipos" while differing in garment type.

**Clubs.** `lib/clubs.ts` holds ~450 clubs and national teams grouped by league and region.
Picking one in the product form auto-fills `league`; a club may appear in only one group or
that lookup becomes ambiguous. The `CLUB_OTHER` option opens a free-text field, so retro or
obscure clubs are never blocked by the list.

**Garment types** are validated in the app rather than by a DB `CHECK`, deliberately — adding
a type is a one-line edit to `GARMENT_TYPES` with no migration.

**Category visibility.** `categories.visible = false` hides a category from the storefront nav
and filters while keeping the row and every product attached to it. This is the intended way
to retire a category; deletion is blocked whenever products still reference it, because
`products.category_id` is `ON DELETE SET NULL` and a blind delete would silently orphan them.

Reads split by audience — using the wrong one is the usual source of "why is this showing to
customers?" bugs:

| Storefront (customer-facing) | Admin |
|------------------------------|-------|
| `getStorefrontProducts()` — `in_stock = true` only | `getProductsByTenant()` — everything |
| `getStorefrontProductBySlug()` — null when out of stock | `getProductBySlug()` |
| `getVisibleCategories()` — `visible = true` only | `getCategoriesByTenant()` — including hidden |

Out-of-stock products are filtered in the SQL query, not in the client, so a hidden product
never even reaches the browser. Its direct URL 404s.

**Storefront filters are derived, not hardcoded.** `ProductsClient` computes the available
clubs, garment types, sizes and the price range from the products actually in the catalog. An
earlier hardcoded `$20.000–$50.000` price slider silently hid every product above $50.000.
Filters with fewer than two distinct values hide themselves rather than render a useless
single checkbox.

**Sizes are `string`, not a union.** Vintage jerseys use numeric sizes (34, 36, 38), so the
`Size` type is a plain string and `SIZE_PRESETS` only supplies the S–XXL defaults.

---

## 10. Environment Variables

| Variable | Required | Client-Exposed | Purpose |
|----------|----------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL (`https://{ref}.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anon key — safe to expose, enforced by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Bypasses RLS — server-side only, never sent to browser |
| `DEFAULT_TENANT_SLUG` | No | No | Tenant for root `/` redirect. Defaults to `my-store` |

There is **no base-URL variable**. MercadoPago `back_urls` and `notification_url` come from
`new URL(request.url).origin` in `app/[tenant]/api/orders/route.ts` — the host the request
actually arrived on. localhost, an ngrok tunnel, a Vercel preview and a custom domain all work
with zero configuration, and there is no stale-value failure mode.

**Note:** MercadoPago credentials (`mp_access_token`, `mp_public_key`, `mp_webhook_secret`) are stored per-tenant in the `store_settings` database table. They are configured via the admin settings panel — not in `.env`.

---

## 11. Key Types

```typescript
// ── Tenant ───────────────────────────────────────────────────────────────────
interface Tenant { id: string; name: string; slug: string; owner_email: string | null; created_at: string }

// Public settings (mp_access_token and mp_webhook_secret excluded)
interface StoreSettings {
  tenant_id: string; store_name: string; logo_url: string | null;
  primary_color: string; currency: string; mp_public_key: string | null;
  hero_title: string; hero_subtitle: string; hero_cta: string; hero_secondary: string;
  carousel_images: string[]; newsletter_title: string; newsletter_subtitle: string;
  footer_tagline: string; footer_instagram: string | null; footer_email: string | null;
  order_prefix: string;
  // Payment terms
  installments: number; cash_discount_percent: number;
  // Shipping rates (zone × method)
  ship_home_caba: number; ship_branch_caba: number;
  ship_home_rest: number; ship_branch_rest: number
}

// ── Product ──────────────────────────────────────────────────────────────────
type Size = string                    // not a union: vintage numeric sizes (34, 36, 38)

interface Product {
  id: string; slug: string; name: string; team: string; league: string;
  category: string; categoryId: string | null; garmentType: string;
  price: number; originalPrice?: number;
  sizes: Size[]; availableVersions: JerseyVersion[]; images: string[];
  description: string; features: string[]; badge?: BadgeType;
  inStock: boolean; rating: number; reviewCount: number
}

interface ProductCategory {
  id: string; slug: string; name: string; description: string; image: string;
  count: number; comingSoon?: boolean; visible: boolean; sortOrder: number
}

// ── Order ────────────────────────────────────────────────────────────────────
type PaymentMethod = 'mercadopago' | 'card' | 'cash'   // 'cash' = efectivo OR transferencia

interface DBOrder {
  id: string; tenant_id: string; number: string; user_id: string | null;
  customer_name: string; customer_email: string; customer_phone: string | null;
  subtotal: number; discount: number; discount_code: string | null; total: number;
  payment_method: string; payment_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  // Shipping — shipping_cost is frozen at creation time
  shipping_method: 'domicilio' | 'sucursal' | null;
  shipping_zone: 'caba_gba' | 'resto' | null;
  shipping_cost: number;
  tracking_number: string | null;
  shipped_at: string | null;          // null ⇒ still in the dispatch queue
  order_items?: DBOrderItem[]
}

// ── Checkout payloads ────────────────────────────────────────────────────────
// From client — no prices, no tenant info
interface OrderRequest {
  customer: { name, email, phone, address, city, state, zip, country };
  items: [{ productId: string; size: string; version: string; quantity: number }];
  paymentMethod: PaymentMethod;
  discountCode: string | null;
  shipping: { zone: 'caba_gba' | 'resto'; method: 'domicilio' | 'sucursal' }
}

// Internal server payload — prices verified server-side
interface CreateOrderPayload {
  tenantId: string; tenantSlug: string; orderPrefix: string;
  customer: { ... }; items: [{ productId, productName, productTeam, size, version, quantity, price, image }];
  subtotal: number;
  discount: number;                   // coupon + cash discount, already summed
  discountCode: string | null;
  shippingMethod: 'domicilio' | 'sucursal';
  shippingZone: 'caba_gba' | 'resto';
  shippingCost: number;
  total: number; paymentMethod: PaymentMethod
}

// ── Admin mutation types (safe to import in 'use client' components) ─────────
interface ProductInsert {
  slug, name, team, league, category_id, garment_type, price, original_price,
  sizes, available_versions, images, description, features, badge, in_stock
}
interface CategoryPayload { name, slug?, description?, visible?, sort_order? }
interface CouponInsert { code, type: 'percent' | 'fixed', value, active?, max_uses? }
```

> **`price` vs `original_price` — deliberate label inversion.** In the DB, `price` is what the
> customer is charged (the large figure) and `original_price` is the struck-through "before"
> price. The admin form labels them **"Precio original"** and **"Precio en oferta (opcional)"**
> respectively, which reads backwards. This was an explicit product decision after the
> mismatch was raised: only the labels changed, the storage semantics did not. Do not "fix"
> the mapping — the storefront display depends on the current one.

---

## 12. SQL Files

Apply in this order:

| File | Purpose |
|------|---------|
| `supabase/schema-multitenancy.sql` | Creates all tables, indexes, RLS enable + policies |
| `supabase/security-hardening.sql` | Revokes `SELECT` on `store_settings` from anon/authenticated; creates `store_settings_public` view; adds `claim_coupon()` RPC |
| `supabase/rls-hardening.sql` | `SECURITY DEFINER` on helper functions; revokes `INSERT` on orders/order_items; adds `mp_webhook_secret` column; adds `order_counter` column + `next_order_number_for_tenant()` RPC; adds `transition_order_status()` RPC |
| `supabase/migration-002-garment-categories.sql` | Adds `products.garment_type` + index; `categories.visible`; backfills garment types by product name |
| `supabase/migration-003-pagos-envios.sql` | Adds `installments`, `cash_discount_percent`, the four `ship_*` rates; `orders.shipping_method/zone/cost/tracking_number/shipped_at` + dispatch index; widens the `payment_method` CHECK to accept `cash`; rebuilds `store_settings_public` |
| `supabase/seed-multitenancy.sql` | Demo tenant, categories, products, coupons (optional, development only) |

Both migrations are idempotent (`ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`) and
safe to re-run. Neither deletes data: migration 002 renames a category with `UPDATE` and hides
another with `visible = false` rather than dropping rows.

> **Deployment note:** Apply TypeScript changes (service client in `createOrder`, `validateCoupon`, `updateStoreSettings`) at the same time as `rls-hardening.sql`. Applying the SQL REVOKEs before updating the code will cause runtime errors.

> **Running migrations.** The Supabase REST API cannot execute DDL, and this project has no
> direct Postgres connection string configured. Migrations are applied through the SQL Editor
> in the Supabase dashboard. The editor is Monaco, which auto-closes brackets and quotes when
> text is typed character by character — set the content via the editor model instead of
> simulating keystrokes if you are automating it.

---

## Dependency Summary

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.29 | Framework (App Router) |
| `react` / `react-dom` | ^18 | UI runtime |
| `@supabase/supabase-js` | ^2 | Supabase JS client |
| `@supabase/ssr` | ^0.10 | Cookie-based session for Next.js App Router |
| `zustand` | ^4.5 | Cart state (per-tenant factory pattern) |
| `tailwindcss` | ^3.4 | Styling |
| `lucide-react` | ^0.427 | Icons |
| `clsx` + `tailwind-merge` | latest | Conditional class merging |
