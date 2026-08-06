import { requireTenant } from '@/lib/tenant'
import { getStorefrontProducts } from '@/lib/db/products'
import { getVisibleCategories } from '@/lib/db/settings'
import { ProductsClient } from '@/components/products/ProductsClient'

interface Props {
  params: { tenant: string }
  searchParams: { category?: string; size?: string; garment?: string; club?: string }
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { tenant } = await requireTenant(params.tenant)

  const [products, categories] = await Promise.all([
    getStorefrontProducts(tenant.id),
    getVisibleCategories(tenant.id),
  ])

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      tenantSlug={params.tenant}
      initialCategory={searchParams.category}
      initialGarment={searchParams.garment}
      initialClub={searchParams.club}
    />
  )
}
