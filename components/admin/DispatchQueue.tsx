'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { DBOrder } from '@/types'
import { formatPriceARS } from '@/lib/utils'
import { ZONE_LABELS, METHOD_LABELS, isShippingZone, isShippingMethod } from '@/lib/shipping'
import { Package, Truck, Store, Check } from 'lucide-react'

interface Props {
  initialOrders: DBOrder[]
  tenantSlug: string
}

/** Días enteros desde que se creó el pedido. */
function daysWaiting(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

/** El color escala con la espera: verde hasta 2 días, ámbar hasta 5, rojo después. */
function agingClass(days: number): string {
  if (days >= 5) return 'bg-red-100 text-red-700'
  if (days >= 3) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

export function DispatchQueue({ initialOrders, tenantSlug }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [openId, setOpenId] = useState<string | null>(null)
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleShip = (orderId: string) => {
    const value = tracking.trim()
    if (!value) { setError('Cargá el número de seguimiento'); return }
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/${tenantSlug}/api/orders/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: value }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error ?? `Error ${res.status}`)
        return
      }
      // Sale de la cola apenas se despacha.
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      setOpenId(null)
      setTracking('')
    })
  }

  if (orders.length === 0) {
    return (
      <>
        <p className="font-body text-sm text-gray-500 mt-1 mb-8">Sin pedidos pendientes de envío.</p>
        <div className="bg-white border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="font-heading text-xl tracking-wider text-gray-300">NADA POR DESPACHAR</p>
          <p className="font-body text-sm text-gray-400 mt-2">
            Acá aparecen los pedidos pagados que todavía no salieron.
          </p>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-gray-500 -mt-7 mb-8">
        {orders.length} pedido{orders.length === 1 ? '' : 's'} pagado
        {orders.length === 1 ? '' : 's'} esperando salir.
      </p>
      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-100 divide-y divide-gray-100">
        {orders.map((order) => {
          const days = daysWaiting(order.created_at)
          const method = isShippingMethod(order.shipping_method) ? order.shipping_method : null
          const zone = isShippingZone(order.shipping_zone) ? order.shipping_zone : null
          const Icon = method === 'sucursal' ? Store : Truck
          const isOpen = openId === order.id

          return (
            <div key={order.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[14rem]">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/${tenantSlug}/admin/orders/${order.id}`}
                      className="font-heading text-base tracking-wider text-gray-900 hover:text-[#029CDC]"
                    >
                      {order.number}
                    </Link>
                    <span className={`px-2 py-0.5 rounded font-body text-xs ${agingClass(days)}`}>
                      {days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`}
                    </span>
                  </div>
                  <p className="font-body text-sm text-gray-700">{order.customer_name}</p>
                  <p className="font-body text-xs text-gray-400">
                    {order.customer_address}, {order.customer_city}
                    {order.customer_state ? `, ${order.customer_state}` : ''}
                    {order.customer_zip ? ` (CP ${order.customer_zip})` : ''}
                  </p>
                </div>

                <div className="min-w-[13rem]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} className="text-gray-400" />
                    <span className="font-body text-sm text-gray-700">
                      {method ? METHOD_LABELS[method] : 'Envío sin especificar'}
                    </span>
                  </div>
                  <p className="font-body text-xs text-gray-400">
                    {zone ? ZONE_LABELS[zone] : '—'} · {formatPriceARS(Number(order.shipping_cost))}
                  </p>
                  <p className="font-body text-xs text-gray-400">
                    {order.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0} artículo(s) ·
                    {' '}{formatPriceARS(Number(order.total))}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isOpen ? (
                    <div className="flex gap-2">
                      <input
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleShip(order.id) }}
                        autoFocus
                        placeholder="N° de seguimiento"
                        className="border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC] w-44"
                      />
                      <button
                        onClick={() => handleShip(order.id)}
                        disabled={isPending}
                        className="px-3 py-2 bg-emerald-600 text-white font-heading tracking-wider text-xs hover:opacity-90 disabled:opacity-60"
                      >
                        {isPending ? '...' : 'DESPACHAR'}
                      </button>
                      <button
                        onClick={() => { setOpenId(null); setTracking(''); setError(null) }}
                        className="px-3 py-2 border border-gray-200 font-body text-sm text-gray-500 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setOpenId(order.id); setTracking(''); setError(null) }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00273E] text-white font-heading tracking-wider text-xs hover:bg-[#029CDC] transition-colors"
                    >
                      <Check size={14} /> MARCAR ENVIADO
                    </button>
                  )}
                </div>
              </div>

              {/* Qué hay que empaquetar */}
              {order.order_items && order.order_items.length > 0 && (
                <ul className="mt-3 pl-1 space-y-1 border-l-2 border-gray-100">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="font-body text-xs text-gray-500 pl-3">
                      {item.quantity}× {item.product_name} — Talle {item.size} / {item.version}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <p className="font-body text-xs text-gray-400">
        Ordenados del más viejo al más nuevo. Un pedido sale de esta lista apenas cargás
        su número de seguimiento.
      </p>
    </div>
  )
}
