'use client'

import { useState, useTransition } from 'react'
import { OrderStatus } from '@/types'

interface Props {
  orderId: string
  tenantSlug: string
  currentStatus: OrderStatus
}

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export function OrderStatusUpdater({ orderId, tenantSlug, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus
    startTransition(async () => {
      const res = await fetch(`/${tenantSlug}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) setStatus(newStatus)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <label className="font-body text-xs text-gray-500 uppercase tracking-wider">Estado:</label>
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className="border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC] disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
    </div>
  )
}
