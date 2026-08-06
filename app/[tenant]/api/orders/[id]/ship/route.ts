import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ApiError } from '@/lib/api-utils'
import { getOrderById, markOrderShipped, updateTrackingNumber } from '@/lib/db/orders'

interface ShipPayload {
  trackingNumber: string
}

/**
 * Despacha un pedido: lo saca de la cola y guarda el seguimiento.
 *
 * Si el pedido ya salió, sólo corrige el número de seguimiento sin pisar
 * shipped_at — así un typo en el tracking no falsea la fecha de despacho.
 */
export const POST = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body: ShipPayload = await (req as NextRequest).json()
    const tracking = (body.trackingNumber ?? '').trim()

    if (!tracking) {
      throw new ApiError('Cargá el número de seguimiento', 400)
    }

    const existing = await getOrderById(params.id, tenant.id)
    if (!existing) throw new ApiError('Pedido no encontrado', 404)

    if (existing.shipped_at) {
      await updateTrackingNumber(params.id, tenant.id, tracking)
      return NextResponse.json({ order: await getOrderById(params.id, tenant.id) })
    }

    if (existing.status !== 'paid') {
      throw new ApiError(
        `El pedido está en "${existing.status}". Sólo se despachan los pagados.`,
        409
      )
    }

    const order = await markOrderShipped(params.id, tenant.id, tracking)
    return NextResponse.json({ order })
  }
)
