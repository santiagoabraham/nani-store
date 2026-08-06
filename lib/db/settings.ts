import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StoreSettings, DBCategory, ProductCategory } from '@/types'

function toCategory(
  row: DBCategory & { products?: { count: number }[] }
): ProductCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    image: row.image ?? '',
    count: row.products?.[0]?.count ?? 0,
    comingSoon: row.coming_soon,
    visible: row.visible,
    sortOrder: row.sort_order,
  }
}

/**
 * Todas las categorías del tenant, visibles y ocultas.
 * Es la vista del ADMIN — en la tienda usar getVisibleCategories.
 */
export async function getCategoriesByTenant(tenantId: string): Promise<ProductCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toCategory)
}

/** Sólo las categorías marcadas como visibles — menú y filtros de la tienda. */
export async function getVisibleCategories(tenantId: string): Promise<ProductCategory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .eq('tenant_id', tenantId)
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(toCategory)
}

export async function updateStoreSettings(
  tenantId: string,
  data: Partial<Omit<StoreSettings, 'tenant_id'>>
): Promise<void> {
  // Service client: SELECT is revoked from authenticated on store_settings base table
  // (security-hardening.sql), so UPDATE ... WHERE tenant_id = ? would fail without it.
  // Auth guard is the API route's requireAdminFromRequest — never call this directly
  // from client components.
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('store_settings')
    .update(data)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function updateMpCredentials(
  tenantId: string,
  mpAccessToken: string,
  mpPublicKey: string
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('store_settings')
    .update({ mp_access_token: mpAccessToken, mp_public_key: mpPublicKey })
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function updateMpWebhookSecret(
  tenantId: string,
  webhookSecret: string
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('store_settings')
    .update({ mp_webhook_secret: webhookSecret })
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function createCategory(
  tenantId: string,
  data: {
    slug: string
    name: string
    description?: string
    image?: string
    coming_soon?: boolean
    visible?: boolean
    sort_order?: number
  }
): Promise<DBCategory> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('categories')
    .insert({ ...data, tenant_id: tenantId })
    .select()
    .single()

  if (error) throw error
  return row as DBCategory
}

export async function updateCategory(
  id: string,
  tenantId: string,
  data: Partial<{
    slug: string
    name: string
    description: string
    image: string
    coming_soon: boolean
    visible: boolean
    sort_order: number
  }>
): Promise<DBCategory> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return row as DBCategory
}

/**
 * Borra una categoría vacía.
 *
 * Si todavía tiene productos colgando, no borra y avisa: products.category_id
 * es ON DELETE SET NULL, así que un borrado a ciegas dejaría los productos sin
 * categoría en silencio. Para sacar de la vitrina una categoría con productos
 * está `visible = false`, que no pierde nada.
 */
export async function deleteCategory(id: string, tenantId: string): Promise<void> {
  const supabase = createClient()

  const { count, error: countErr } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('category_id', id)

  if (countErr) throw countErr
  if ((count ?? 0) > 0) {
    throw new Error(
      `La categoría tiene ${count} producto(s). Ocultala en lugar de borrarla, ` +
      `o movelos antes a otra categoría.`
    )
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
