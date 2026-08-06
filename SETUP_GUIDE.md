# Setup Guide — camisetas-carpi

Step-by-step guide to configure all external services and deploy a new instance of this platform.

---

## Prerequisites

- Node.js 18+
- A GitHub account (for Vercel deployment)
- A Supabase account (free tier works)
- A MercadoPago developer account (for payment processing)

---

## 1. Supabase

### Create a Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, database password, and region (choose the region closest to your users)
3. Wait ~2 minutes for the project to provision

### Find Your Credentials

Go to **Project Settings → API**:

| Value | Location | Goes into |
|-------|----------|-----------|
| Project URL | "Project URL" field | `NEXT_PUBLIC_SUPABASE_URL` |
| Anon key | "Project API keys → anon public" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service role key | "Project API keys → service_role" | `SUPABASE_SERVICE_ROLE_KEY` |

Copy each value straight from the dashboard into `.env.local`. Never paste real values into
this guide, `.env.example`, or any other tracked file.

> **Warning:** The service role key bypasses all Row Level Security — it grants full read,
> write and delete access to every table, including customer orders with names, emails,
> phone numbers and addresses. Never expose it to the browser or commit it to version
> control. If it ever lands in a public place, rotate it immediately from
> **Project Settings → API → service_role → Reset**.

### Run the SQL Schema

Go to **SQL Editor** in the Supabase dashboard and run each file in order:

1. `supabase/schema-multitenancy.sql` — Creates all tables and base RLS policies
2. `supabase/security-hardening.sql` — Locks down store_settings, adds claim_coupon RPC
3. `supabase/rls-hardening.sql` — Adds SECURITY DEFINER helpers, order sequences, webhook secret column
4. `supabase/migration-002-garment-categories.sql` — Garment types, hideable categories
5. `supabase/migration-003-pagos-envios.sql` — Instalments, cash discount, shipping rates, tracking
6. `supabase/seed-multitenancy.sql` — (Optional) Inserts demo tenant and sample products

Run each file completely before moving to the next. If any statement fails, read the error — most are safe to re-run after fixing the issue. Both migration files are idempotent and can be re-run without side effects.

The migrations are not optional: without 003 the checkout cannot create an order, because it writes `shipping_method`, `shipping_zone` and `shipping_cost` on every order.

### Enable Row Level Security

RLS is enabled by `schema-multitenancy.sql`. Verify in **Database → Tables** that each table shows "RLS enabled" in the security column.

### Create the First Tenant

After running the schema, insert your store into the `tenants` table and create its settings:

```sql
-- Insert tenant
INSERT INTO tenants (name, slug, owner_email)
VALUES ('My Store', 'my-store', 'admin@mystore.com');

-- Insert settings (use the tenant ID from the row above)
INSERT INTO store_settings (tenant_id, store_name, order_prefix, primary_color, currency)
VALUES ('<tenant-uuid>', 'My Store', 'ORD', '#029CDC', 'ARS');
```

### Create an Admin User

1. Go to **Authentication → Users → Add user**
2. Enter the admin email and a secure password
3. After creation, run:

```sql
INSERT INTO profiles (id, tenant_id, role)
VALUES (
  '<user-uuid-from-auth>',
  '<tenant-uuid>',
  'admin'
);
```

The admin can now log in at `/{your-tenant-slug}/admin/login`.

---

## 2. Supabase Storage

### Create the Products Bucket

**Do not skip this step.** No SQL file creates the bucket, and a new Supabase project starts
with none. Without it, every product image upload fails with a 500 and the product saves with
no photo.

1. Go to **Storage → New bucket**
2. Name it exactly: `products`
3. Set **Public bucket** to **ON** (product images are served via public CDN URL)
4. Optional but recommended: file size limit `5 MB`, allowed MIME types
   `image/jpeg, image/png, image/webp, image/gif`
5. Click **Create bucket**

To verify it exists (empty `[]` means it is missing):

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Storage Policies

The application upload route enforces admin-only writes at the application layer using the service role client. If you want to add an extra DB-level storage policy:

1. Go to **Storage → Policies → products bucket**
2. Add a policy for `INSERT`:
   - **Allowed operation:** INSERT
   - **Policy definition:** `auth.role() = 'authenticated'`
   - (The app already checks admin role before calling storage)

---

## 3. MercadoPago

### Create a Developer Application

1. Log in at [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Go to **My applications → Create application**
3. Name it (e.g., "My Store"), select **Online payments**, click **Create**

### Find Your Credentials

In your application detail page:

| Value | Location | Where it goes |
|-------|----------|---------------|
| Public Key | "Credentials → Public Key" | Admin settings panel → MP Public Key |
| Access Token | "Credentials → Access Token" | Admin settings panel → MP Access Token |

### Test vs Production

MercadoPago provides two sets of credentials:

- **Test credentials** — Use for development. Payments are simulated. URLs contain `/test/`.
- **Production credentials** — Use for real payments. Only available after account verification.

Switch between them in the Credentials tab of your application. **Never use production credentials in a development environment.**

### Configure the Webhook URL

1. In your MP application → **Webhooks → Add webhook**
2. URL: `https://your-domain.com/{tenant-slug}/api/webhooks/mercadopago`
3. Events to subscribe: **Payments**
4. Copy the **secret** shown after saving
5. Go to your admin panel → Settings → paste the secret into "MP Webhook Secret"

> The webhook secret enables HMAC signature verification. Without it, the webhook still works (it falls back to MP API verification) but replay attacks become possible.

### Interest-Free Instalments

Admin panel → Settings → **Condiciones de pago → Cuotas sin interés** sets how many
instalments buyers are offered. It is sent to MercadoPago as
`payment_methods.installments` on every payment preference.

**That field only caps the instalment count — it does not make the instalments
interest-free.** Whether the buyer pays a surcharge is decided by MercadoPago based on the
instalment campaign active on the seller's account. If no campaign is configured, the
storefront advertises "3 cuotas sin interés" while MercadoPago charges interest.

To make them genuinely interest-free, enable a *cuotas sin interés* campaign in the
MercadoPago dashboard (**Tu negocio → Costos → Cuotas sin interés**) for the same number of
instalments configured here. Note that the seller absorbs the financing cost.

---

## 3b. Payment and Shipping Configuration

All of these live in the admin panel under **Settings**, stored per-tenant in
`store_settings`. Changing them takes effect immediately across the storefront, the checkout
and the MercadoPago preference — no redeploy.

| Setting | Default | Effect |
|---------|---------|--------|
| Cuotas sin interés | `3` | Instalment cap sent to MercadoPago |
| % off efectivo/transferencia | `10` | Discount applied when the buyer picks "Efectivo o transferencia" |
| CABA y GBA — a domicilio | `$10.000` | Shipping rate |
| CABA y GBA — a sucursal | `$8.000` | Shipping rate |
| Resto del país — a domicilio | `$12.000` | Shipping rate |
| Resto del país — a sucursal | `$10.000` | Shipping rate |

The cash discount applies to merchandise after any coupon, never to shipping. Each order
freezes the shipping cost it was charged, so raising rates later does not alter past orders.

Shipping rates are flat placeholders until live Correo Argentino quoting is integrated.
Replacing them means changing `shippingCost()` in `lib/shipping.ts`; the order flow, dispatch
queue and tracking are unaffected.

---

## 4. Email (Optional)

The platform has an `email_from` field in store settings for future transactional email support. No email provider is currently integrated by default.

To add email:

1. Create an account at [resend.com](https://resend.com) (or SendGrid, Postmark, etc.)
2. Get your API key
3. Add `RESEND_API_KEY=re_...` to your `.env.local`
4. Implement sending in a server action or API route using the Resend SDK

The `email_from` value in `store_settings` (e.g., `pedidos@mitienda.com`) is the sender address you want customers to see.

---

## 5. Vercel Deployment

### Import the Project

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Click **Deploy** — the first deploy will fail because env vars are missing

### Add Environment Variables

Go to **Project Settings → Environment Variables** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase dashboard | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase dashboard | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase dashboard | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (`https://your-app.vercel.app`) | Production |
| `DEFAULT_TENANT_SLUG` | Your store slug (e.g., `my-store`) | Production, Preview, Development |

After adding variables, trigger a new deploy from the **Deployments** tab.

### Custom Domain (Optional)

1. Go to **Project Settings → Domains**
2. Add your domain (e.g., `mitienda.com`)
3. Follow Vercel's DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update MercadoPago webhook URL to use the new domain

---

## 6. Environment Variables Reference

Create a `.env.local` file for local development (never commit this file):

```bash
# ── Supabase ──────────────────────────────────────────────────────────────────
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Supabase anon/public key — safe to expose to the browser
# Used by the client-side Supabase client and server-side session management
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key — NEVER expose to the browser
# Bypasses Row Level Security — used server-side only for:
# - Order creation
# - Coupon claiming
# - Settings writes
# - Webhook processing
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── App Configuration ─────────────────────────────────────────────────────────
# Public base URL of the app — used to build MercadoPago back_urls and notification_url
# In development: http://localhost:3000 (use ngrok for MP webhook testing)
# In production: https://your-app.vercel.app or your custom domain
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Slug of the default tenant — root / and legacy routes redirect here
# Must match a slug in the tenants table
DEFAULT_TENANT_SLUG=my-store
```

### MercadoPago Credentials

These are NOT environment variables. They are configured per-tenant in the database via the admin settings panel at `/{tenant}/admin/settings`. Each tenant can have different MP credentials.

| Field | Description |
|-------|-------------|
| MP Access Token | Secret token for server-side API calls |
| MP Public Key | Public key used to initialize MP checkout SDK |
| MP Webhook Secret | HMAC signing secret for webhook verification |

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Create .env.local with the variables above
cp .env.example .env.local
# Edit .env.local with your actual values

# Start the development server
npm run dev
```

The app runs at `http://localhost:3000`. The root `/` redirects to `/{DEFAULT_TENANT_SLUG}`.

### Testing MercadoPago Webhooks Locally

MP webhooks require a public URL. Use [ngrok](https://ngrok.com):

```bash
# In a separate terminal:
ngrok http 3000

# Update .env.local:
NEXT_PUBLIC_APP_URL=https://xxxx.ngrok.io

# Update the webhook URL in your MP application to:
# https://xxxx.ngrok.io/{tenant-slug}/api/webhooks/mercadopago
```

### Running the Type Checker

```bash
npx tsc --noEmit
```

### Building for Production

```bash
npm run build
```

A successful build with no type errors means the application is ready to deploy.

---

## 8. Adding a New Tenant

To add a second store to an existing deployment:

1. **Insert tenant in DB:**
   ```sql
   INSERT INTO tenants (name, slug, owner_email)
   VALUES ('Segunda Tienda', 'segunda', 'admin@segunda.com');
   ```

2. **Insert store settings:**
   ```sql
   INSERT INTO store_settings (tenant_id, store_name, order_prefix, primary_color, currency)
   VALUES ('<new-tenant-uuid>', 'Segunda Tienda', 'ST', '#FF5733', 'ARS');
   ```

3. **Create admin user** via Supabase Auth dashboard + insert into `profiles` with `role='admin'`

4. **Configure MercadoPago** via `/{new-slug}/admin/settings`

5. **Access the new store** at `/{new-slug}/`

No code changes or redeployment needed.
