import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { updateOrderStatus } from '@/lib/db/orders'
import { OrderStatus } from '@/types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body = await (req as NextRequest).json()
    const status: OrderStatus = body.status

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await updateOrderStatus(params.id, tenant.id, status)
    return NextResponse.json({ ok: true })
  }
)
