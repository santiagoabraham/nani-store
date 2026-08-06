import { requireTenant } from '@/lib/tenant'
import { getCategoriesByTenant } from '@/lib/db/settings'
import { TenantProductForm } from '@/components/admin/TenantProductForm'

interface Props { params: { tenant: string } }

export default async function NewProductPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const categories = await getCategoriesByTenant(tenant.id)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-8">NUEVO PRODUCTO</h1>
      <TenantProductForm
        tenantSlug={params.tenant}
        tenantId={tenant.id}
        categories={categories}
      />
    </div>
  )
}
