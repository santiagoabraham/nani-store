import { requireTenant } from '@/lib/tenant'
import { getProductsByTenant } from '@/lib/db/products'
import { getCategoriesByTenant } from '@/lib/db/settings'
import { TenantProductForm } from '@/components/admin/TenantProductForm'
import { notFound } from 'next/navigation'

interface Props { params: { tenant: string; id: string } }

export default async function EditProductPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const [products, categories] = await Promise.all([
    getProductsByTenant(tenant.id),
    getCategoriesByTenant(tenant.id),
  ])

  const product = products.find((p) => p.id === params.id)
  if (!product) notFound()

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-8">EDITAR PRODUCTO</h1>
      <TenantProductForm
        tenantSlug={params.tenant}
        tenantId={tenant.id}
        categories={categories}
        product={product}
      />
    </div>
  )
}
