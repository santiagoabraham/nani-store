import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getTenantFromRequest } from '@/lib/api-utils'
import { getMpAccessToken, getMpWebhookSecret } from '@/lib/tenant'
import { getOrderById, markOrderPaid, markOrderCancelled } from '@/lib/db/orders'

// MercadoPago webhook payload (2024 format)
interface MpWebhookBody {
  type?: string       // 'payment'
  action?: string     // 'payment.created' | 'payment.updated'
  data?: { id?: string }
}

// MercadoPago payment object (relevant fields only)
interface MpPayment {
  id: number
  status: string         // 'approved' | 'rejected' | 'cancelled' | 'pending' | ...
  external_reference: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  // Always return 200 at the end — MercadoPago retries on non-2xx responses,
  // which would hammer the endpoint. Log errors instead of surfacing them.
  try {
    // 1. Resolve tenant from URL slug — ensures the webhook targets a real store
    const { tenant } = await getTenantFromRequest(params.tenant)

    // 2. Read body as raw text to allow HMAC verification before parsing
    const rawBody = await request.text()
    let body: MpWebhookBody
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ ok: true }) // malformed JSON — ignore silently
    }

    // 3. Only act on payment events; acknowledge everything else
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(body.data.id)

    // 4. HMAC signature verification (if tenant has configured a webhook secret)
    //    MP header format: x-signature: ts=<epoch>;v1=<hex_hmac>
    //    Signed message:   "id:<payment_id>;request-id:<x-request-id>;ts:<epoch>"
    const webhookSecret = await getMpWebhookSecret(tenant.id)
    if (webhookSecret) {
      const signature  = request.headers.get('x-signature') ?? ''
      const requestId  = request.headers.get('x-request-id') ?? ''
      const ts         = signature.match(/ts=(\d+)/)?.[1]    ?? ''
      const v1         = signature.match(/v1=([a-f0-9]+)/)?.[1] ?? ''

      if (!ts || !v1) {
        console.warn(`[mp-webhook/${tenant.slug}] Missing signature fields`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Replay attack prevention: reject webhooks whose timestamp is more than
      // 5 minutes old. Without this check, an attacker who intercepts a valid
      // x-signature can replay it indefinitely.
      const tsSeconds = parseInt(ts, 10)
      const nowSeconds = Math.floor(Date.now() / 1000)
      const MAX_WEBHOOK_AGE_SECONDS = 300 // 5 minutes
      if (isNaN(tsSeconds) || Math.abs(nowSeconds - tsSeconds) > MAX_WEBHOOK_AGE_SECONDS) {
        console.warn(`[mp-webhook/${tenant.slug}] Webhook timestamp out of window: ${ts}`)
        return NextResponse.json({ error: 'Webhook expired' }, { status: 401 })
      }

      const template = `id:${paymentId};request-id:${requestId};ts:${ts}`
      const expected  = createHmac('sha256', webhookSecret).update(template).digest('hex')

      // Timing-safe comparison prevents timing-oracle attacks
      let signatureValid = false
      try {
        signatureValid = timingSafeEqual(
          Buffer.from(v1,       'hex'),
          Buffer.from(expected, 'hex')
        )
      } catch {
        signatureValid = false // buffers were different lengths → definitely invalid
      }

      if (!signatureValid) {
        console.warn(`[mp-webhook/${tenant.slug}] Signature mismatch for payment ${paymentId}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 5. Verify payment via the MP API using the tenant's own access token.
    //    This doubles as authentication: only a real MP payment from THIS tenant's
    //    account can be fetched with this token, preventing cross-tenant spoofing.
    const accessToken = await getMpAccessToken(tenant.id)
    if (!accessToken) {
      console.error(`[mp-webhook/${tenant.slug}] No MP access token configured`)
      return NextResponse.json({ ok: true }) // misconfigured tenant — don't 500
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        // Disable caching — always fetch the live payment status
        cache: 'no-store',
      }
    )

    if (!mpRes.ok) {
      // 404 → payment not from this tenant's MP account → silently ignore
      // 4xx → malformed request → log and ignore
      console.error(`[mp-webhook/${tenant.slug}] MP API ${mpRes.status} for payment ${paymentId}`)
      return NextResponse.json({ ok: true })
    }

    const payment = (await mpRes.json()) as MpPayment

    // 6. Map payment to an order via external_reference (set at preference creation time)
    const orderId = payment.external_reference
    if (!orderId) {
      return NextResponse.json({ ok: true }) // payment not linked to any order
    }

    // 7. Verify the order belongs to THIS tenant — prevents cross-tenant status updates.
    //    getOrderById filters by tenant_id, so a forged external_reference pointing to
    //    another tenant's order will simply return null here.
    const order = await getOrderById(orderId, tenant.id)
    if (!order) {
      console.warn(`[mp-webhook/${tenant.slug}] Order ${orderId} not found in tenant`)
      return NextResponse.json({ ok: true })
    }

    // 8. Transition order status atomically via transition_order_status() RPC.
    //    The function is idempotent: duplicate webhooks for the same payment are safe.
    //    It also enforces forward-only transitions so a later 'cancelled' webhook
    //    cannot roll back an already-shipped order.
    if (payment.status === 'approved') {
      await markOrderPaid(order.id, tenant.id, paymentId)
    } else if (['rejected', 'cancelled', 'refunded'].includes(payment.status)) {
      await markOrderCancelled(order.id, tenant.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Catch-all: return 200 so MP doesn't retry — the error is logged server-side
    console.error('[mp-webhook] Unhandled error:', err)
    return NextResponse.json({ ok: true })
  }
}
