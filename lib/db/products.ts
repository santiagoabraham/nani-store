import { createClient } from '@/lib/supabase/server'
import { DBProduct, Product } from '@/types'

/** Map a DB row to the frontend Product shape. */
export function toProduct(row: DBProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    team: row.team,
    league: row.league,
    category: row.categories?.slug ?? '',
    categoryId: row.category_id,
    garmentType: row.garment_type ?? '',
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    sizes: row.sizes as Product['sizes'],
    availableVersions: row.available_versions as Product['availableVersions'],
    images: row.images,
    description: row.description ?? '',
    features: row.features,
    badge: row.badge as Product['badge'],
    inStock: row.in_stock,
    rating: Number(row.rating),
    reviewCount: row.review_count,
  }
}

const PRODUCT_QUERY =
  '*, categories(slug)'

/**
 * Todos los productos del tenant, con stock y sin stock.
 * Es la vista del ADMIN — no usar en páginas de la tienda.
 */
export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_QUERY)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DBProduct[]).map(toProduct)
}

/**
 * Lo que ve un comprador: sólo productos en stock.
 * Al sacar un producto del stock desde el panel desaparece de la
 * vitrina, de la home y de los relacionados. El filtro va en la
 * query y no en el cliente para que el producto oculto ni siquiera
 * viaje en el HTML.
 */
export async function getStorefrontProducts(tenantId: string): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_QUERY)
    .eq('tenant_id', tenantId)
    .eq('in_stock', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DBProduct[]).map(toProduct)
}

export async function getProductBySlug(slug: string, tenantId: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_QUERY)
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return toProduct(data as DBProduct)
}

/** Como getProductBySlug pero devuelve null si el producto está sin stock. */
export async function getStorefrontProductBySlug(
  slug: string,
  tenantId: string
): Promise<Product | null> {
  const product = await getProductBySlug(slug, tenantId)
  return product?.inStock ? product : null
}

export interface ProductInsert {
  slug: string
  name: string
  team: string
  league: string
  category_id: string | null
  garment_type: string | null
  price: number
  original_price: number | null
  sizes: string[]
  available_versions: string[]
  images: string[]
  description: string
  features: string[]
  badge: string | null
  in_stock: boolean
}

export async function createProduct(tenantId: string, data: ProductInsert): Promise<Product> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('products')
    .insert({ ...data, tenant_id: tenantId })
    .select(PRODUCT_QUERY)
    .single()

  if (error) throw error
  return toProduct(row as DBProduct)
}

export async function updateProduct(
  id: string,
  tenantId: string,
  data: Partial<ProductInsert>
): Promise<Product> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)  // RLS + belt-and-suspenders
    .select(PRODUCT_QUERY)
    .single()

  if (error) throw error
  return toProduct(row as DBProduct)
}

export async function deleteProduct(id: string, tenantId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function getProductsByIds(ids: string[], tenantId: string): Promise<Product[]> {
  if (ids.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_QUERY)
    .eq('tenant_id', tenantId)
    .in('id', ids)

  if (error) throw error
  return (data as DBProduct[]).map(toProduct)
}

export async function toggleProductStock(
  id: string,
  tenantId: string,
  inStock: boolean
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('products')
    .update({ in_stock: inStock })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
