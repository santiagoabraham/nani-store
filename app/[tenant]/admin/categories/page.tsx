import { requireTenant } from '@/lib/tenant'
import { getCategoriesByTenant } from '@/lib/db/settings'
import { CategoriesManager } from '@/components/admin/CategoriesManager'

interface Props { params: { tenant: string } }

export default async function AdminCategoriesPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  // getCategoriesByTenant (y no getVisibleCategories) para que el panel
  // también liste las ocultas y se puedan volver a mostrar.
  const categories = await getCategoriesByTenant(tenant.id)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-8">CATEGORÍAS</h1>
      <CategoriesManager
        initialCategories={categories}
        tenantSlug={params.tenant}
      />
    </div>
  )
}
