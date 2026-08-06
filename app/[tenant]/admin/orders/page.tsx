import { requireTenant } from '@/lib/tenant'
import { getOrdersByTenant } from '@/lib/db/orders'
import { formatPriceARS } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  params: { tenant: string }
  searchParams: { status?: string }
}

const STATUS_OPTS = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-orange-100 text-orange-700',
}

export default async function AdminOrdersPage({ params, searchParams }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const allOrders = await getOrdersByTenant(tenant.id)
  const base = `/${params.tenant}/admin`

  const activeStatus = searchParams.status ?? 'all'
  const orders = activeStatus === 'all'
    ? allOrders
    : allOrders.filter((o) => o.status === activeStatus)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-8">PEDIDOS</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {STATUS_OPTS.map((s) => {
          const count = s === 'all' ? allOrders.length : allOrders.filter((o) => o.status === s).length
          return (
            <Link
              key={s}
              href={`${base}/orders?status=${s}`}
              className={`px-4 py-2 font-body text-sm transition-colors ${
                activeStatus === s
                  ? 'bg-[#00273E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]} ({count})
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Pedido', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-heading text-xs tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-gray-400">Sin pedidos</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-heading text-sm tracking-wider text-gray-900">{order.number}</td>
                <td className="px-5 py-4">
                  <p className="font-body text-sm text-gray-900">{order.customer_name}</p>
                  <p className="font-body text-xs text-gray-400">{order.customer_email}</p>
                </td>
                <td className="px-5 py-4 font-body text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-4 font-heading text-sm text-gray-900">
                  {formatPriceARS(Number(order.total))}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded font-body text-xs ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`${base}/orders/${order.id}`}
                    className="font-body text-xs text-[#029CDC] hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
