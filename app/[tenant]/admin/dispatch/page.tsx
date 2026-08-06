import { requireTenant } from '@/lib/tenant'
import { getOrdersToDispatch } from '@/lib/db/orders'
import { DispatchQueue } from '@/components/admin/DispatchQueue'

interface Props { params: { tenant: string } }

export default async function AdminDispatchPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const orders = await getOrdersToDispatch(tenant.id)

  return (
    <div className="p-8">
      {/* El contador lo pinta DispatchQueue y no esta página: al despachar,
          la lista se actualiza en el cliente y un número renderizado acá
          quedaría contando un pedido que ya salió. */}
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider">POR DESPACHAR</h1>
      <DispatchQueue initialOrders={orders} tenantSlug={params.tenant} />
    </div>
  )
}
