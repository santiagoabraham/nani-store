import { createClient, createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tenant, StoreSettings, TenantContextValue } from '@/types'

/**
 * Fetch tenant + public store settings by URL slug.
 * Returns null if the tenant does not exist.
 * mp_access_token is deliberately excluded — use getPrivateSettings() server-side.
 */
export async function getTenantBySlug(slug: string): Promise<TenantContextValue | null> {
  const supabase = createClient()

  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (tErr || !tenant) return null

  // Query the restricted VIEW — mp_access_token is excluded at the DB layer.
  // Direct SELECT on the store_settings table is revoked for anon/authenticated roles.
  const { data: settings, error: sErr } = await supabase
    .from('store_settings_public')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  if (sErr || !settings) return null

  return {
    tenant: tenant as Tenant,
    settings: settings as StoreSettings,
  }
}

/**
 * Like getTenantBySlug but calls notFound() instead of returning null.
 * Use in Server Components / layouts where a missing tenant = 404.
 */
export async function requireTenant(slug: string): Promise<TenantContextValue> {
  const result = await getTenantBySlug(slug)
  if (!result) notFound()
  return result
}

/**
 * Fetch the mp_access_token for a tenant.
 * Server-side only — NEVER pass this value to the client.
 */
/**
 * Fetch the mp_access_token for a tenant.
 * Uses the SERVICE ROLE client to bypass the SELECT restriction on
 * store_settings — this function MUST only be called in server-side
 * trusted contexts (Server Components, Route Handlers). NEVER in
 * client components or via a public API.
 */
export async function getMpAccessToken(tenantId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('store_settings')
    .select('mp_access_token')
    .eq('tenant_id', tenantId)
    .single()
  return data?.mp_access_token ?? null
}

/** Fetch the mp_webhook_secret for signature verification on incoming webhooks. */
export async function getMpWebhookSecret(tenantId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('store_settings')
    .select('mp_webhook_secret')
    .eq('tenant_id', tenantId)
    .single()
  return data?.mp_webhook_secret ?? null
}
