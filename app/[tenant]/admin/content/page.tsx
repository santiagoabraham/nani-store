import { requireTenant } from '@/lib/tenant'
import { getAllPerks } from '@/lib/db/perks'
import { PerksManager } from '@/components/admin/PerksManager'

interface Props { params: { tenant: string } }

export default async function AdminContentPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const perks = await getAllPerks(tenant.id)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider">CONTENIDO</h1>
      <p className="font-body text-sm text-gray-500 mt-1 mb-8">
        Los bloques de beneficios que ve el comprador. Antes estaban escritos en el código.
      </p>
      <PerksManager initialPerks={perks} tenantSlug={params.tenant} />
    </div>
  )
}
