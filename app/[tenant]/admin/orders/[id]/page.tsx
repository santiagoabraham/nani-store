import { requireTenant } from '@/lib/tenant'
import { getOrderById } from '@/lib/db/orders'
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater'
import { formatPriceARS } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props { params: { tenant: string; id: string } }

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
}

export default async function OrderDetailPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const order = await getOrderById(params.id, tenant.id)
  if (!order) notFound()

  const base = `/${params.tenant}/admin`

  return (
    <div className="p-8">
      <Link href={`${base}/orders`} className="flex items-center gap-1 font-body text-sm text-gray-400 hover:text-gray-600 mb-8">
        <ChevronLeft size={15} /> Volver a pedidos
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl text-gray-900 tracking-wider">{order.number}</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <OrderStatusUpdater
          orderId={order.id}
          tenantSlug={params.tenant}
          currentStatus={order.status}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items + totals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading text-lg tracking-wider text-gray-900 mb-4">PRODUCTOS</h2>
            <div className="space-y-4">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.image && (
                    <div className="relative w-16 h-20 bg-gray-50 flex-shrink-0">
                      <Image src={item.image} alt={item.product_name} fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-heading text-sm text-gray-900">{item.product_name}</p>
                    <p className="font-body text-xs text-gray-400">{item.product_team} · T{item.size} · {item.version} · x{item.quantity}</p>
                  </div>
                  <p className="font-heading text-sm text-gray-900">{formatPriceARS(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1.5 font-body text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPriceARS(Number(order.subtotal))}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento {order.discount_code && `(${order.discount_code})`}</span>
                  <span>-{formatPriceARS(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500"><span>Envío</span><span className="text-emerald-600">Gratis</span></div>
              <div className="flex justify-between font-heading text-xl text-gray-900 pt-2 border-t border-gray-100">
                <span>TOTAL</span><span>{formatPriceARS(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer + payment */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading text-lg tracking-wider text-gray-900 mb-4">CLIENTE</h2>
            <dl className="space-y-2 font-body text-sm">
              {[
                ['Nombre', order.customer_name],
                ['Email', order.customer_email],
                ['Teléfono', order.customer_phone],
                ['Dirección', order.customer_address],
                ['Ciudad', order.customer_city],
                ['Provincia', order.customer_state],
              ].map(([k, v]) => v ? (
                <div key={k} className="flex gap-2">
                  <dt className="text-gray-400 w-24 flex-shrink-0">{k}</dt>
                  <dd className="text-gray-700 break-all">{v}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="font-heading text-lg tracking-wider text-gray-900 mb-4">PAGO</h2>
            <p className="font-body text-sm text-gray-700 capitalize">{order.payment_method}</p>
            {order.payment_id && <p className="font-body text-xs text-gray-400 mt-1 break-all">{order.payment_id}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
