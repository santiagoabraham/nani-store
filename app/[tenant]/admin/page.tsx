import { requireTenant } from '@/lib/tenant'
import { getOrderStats, getOrdersByTenant } from '@/lib/db/orders'
import { getProductsByTenant } from '@/lib/db/products'
import { getCouponsByTenant } from '@/lib/db/coupons'
import { formatPriceARS } from '@/lib/utils'
import Link from 'next/link'
import { ShoppingBag, Shirt, Tag, TrendingUp, Clock, CheckCircle, Truck, Package } from 'lucide-react'

interface Props { params: { tenant: string } }

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

export default async function AdminDashboard({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const base = `/${params.tenant}/admin`

  const [stats, allOrders, products, coupons] = await Promise.all([
    getOrderStats(tenant.id),
    getOrdersByTenant(tenant.id),
    getProductsByTenant(tenant.id),
    getCouponsByTenant(tenant.id),
  ])

  const recentOrders = allOrders.slice(0, 5)
  const inStockProducts = products.filter((p) => p.inStock).length
  const activeCoupons = coupons.filter((c) => c.active).length

  const kpis = [
    { label: 'Ingresos Totales', value: formatPriceARS(stats.totalRevenue), icon: TrendingUp, color: 'bg-[#029CDC]', sub: `${stats.totalOrders} pedidos` },
    { label: 'Pedidos Pendientes', value: String(stats.pendingCount), icon: Clock, color: 'bg-amber-500', sub: 'Requieren atención' },
    { label: 'Productos en Stock', value: String(inStockProducts), icon: Shirt, color: 'bg-[#00273E]', sub: `${products.length} total` },
    { label: 'Cupones Activos', value: String(activeCoupons), icon: Tag, color: 'bg-emerald-600', sub: `${coupons.length} total` },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-gray-900 tracking-wider">DASHBOARD</h1>
        <p className="font-body text-sm text-gray-500 mt-1">Resumen general de {tenant.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-body text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="font-heading text-3xl text-gray-900 mt-1">{value}</p>
                <p className="font-body text-xs text-gray-400 mt-1">{sub}</p>
              </div>
              <div className={`${color} p-3 rounded`}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl tracking-wider text-gray-900">PEDIDOS RECIENTES</h2>
            <Link href={`${base}/orders`} className="font-body text-xs text-[#029CDC] hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 && (
              <p className="font-body text-sm text-gray-400 py-4 text-center">Sin pedidos aún</p>
            )}
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`${base}/orders/${order.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors rounded border border-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-gray-100 flex items-center justify-center">
                    <ShoppingBag size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-heading text-sm text-gray-900 tracking-wider">{order.number}</p>
                    <p className="font-body text-xs text-gray-500">{order.customer_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading text-sm text-gray-900">{formatPriceARS(Number(order.total))}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-body ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Status + quick actions */}
        <div className="bg-white shadow-sm border border-gray-100 p-6">
          <h2 className="font-heading text-xl tracking-wider text-gray-900 mb-6">ESTADO DE PEDIDOS</h2>
          <div className="space-y-4">
            {[
              { status: 'pending',   label: 'Pendientes', icon: Clock,       count: stats.pendingCount },
              { status: 'paid',      label: 'Pagados',    icon: CheckCircle, count: stats.paidCount },
              { status: 'shipped',   label: 'Enviados',   icon: Truck,       count: stats.shippedCount },
              { status: 'delivered', label: 'Entregados', icon: Package,     count: stats.deliveredCount },
            ].map(({ status, label, icon: Icon, count }) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${STATUS_COLOR[status]}`}>
                    <Icon size={12} />
                  </span>
                  <span className="font-body text-sm text-gray-600">{label}</span>
                </div>
                <span className="font-heading text-lg text-gray-900">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-heading text-sm tracking-wider text-gray-500 mb-3">ACCIONES RÁPIDAS</h3>
            <div className="space-y-2">
              <Link href={`${base}/products/new`} className="block w-full text-center bg-[#029CDC] text-white font-heading tracking-wider text-xs py-3 hover:opacity-90 transition-colors">
                + NUEVO PRODUCTO
              </Link>
              <Link href={`${base}/coupons`} className="block w-full text-center border border-[#00273E] text-[#00273E] font-heading tracking-wider text-xs py-3 hover:bg-[#00273E] hover:text-white transition-colors">
                + NUEVO CUPÓN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
