import { requireTenant } from '@/lib/tenant'
import { getStorefrontProductBySlug, getStorefrontProducts } from '@/lib/db/products'
import { getVisiblePerks } from '@/lib/db/perks'
import { ProductDetailClient } from '@/components/products/ProductDetailClient'
import { notFound } from 'next/navigation'

interface Props {
  params: { tenant: string; slug: string }
}

export async function generateMetadata({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const product = await getStorefrontProductBySlug(params.slug, tenant.id)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)

  // getStorefrontProductBySlug devuelve null si el producto está sin stock,
  // así que sacarlo del stock desde el panel también mata su link directo.
  const [product, allProducts, perks] = await Promise.all([
    getStorefrontProductBySlug(params.slug, tenant.id),
    getStorefrontProducts(tenant.id),
    getVisiblePerks(tenant.id, 'product'),
  ])

  if (!product) notFound()

  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <ProductDetailClient
      product={product}
      related={related}
      tenantSlug={params.tenant}
      perks={perks}
    />
  )
}
