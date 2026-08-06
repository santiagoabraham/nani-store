import { NextRequest, NextResponse } from 'next/server'
import { getTenantFromRequest, apiError } from '@/lib/api-utils'
import { createOrder } from '@/lib/db/orders'
import { getProductsByIds } from '@/lib/db/products'
import { claimCoupon } from '@/lib/db/coupons'
import { getMpAccessToken } from '@/lib/tenant'
import { shippingCost, isShippingZone, isShippingMethod } from '@/lib/shipping'
import { cashDiscountAmount, qualifiesForCashDiscount } from '@/lib/pricing'
import { OrderRequest, CreateOrderPayload, DBOrder } from '@/types'

// ── MercadoPago preference creation ──────────────────────────────────────────
// Called only when paymentMethod === 'mercadopago' AND the tenant has a token.
// Sets external_reference = order.id so the webhook can map payment → order.
interface MpPreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
}

async function createMpPreference(
  accessToken: string,
  order: DBOrder,
  payload: CreateOrderPayload,
  baseUrl: string,
  tenantSlug: string,
  installments: number
): Promise<MpPreferenceResponse> {
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_reference: order.id,
      items: [
        ...payload.items.map((i) => ({
          id: i.productId,
          title: `${i.productName} — Talle ${i.size} / ${i.version}`,
          quantity: i.quantity,
          unit_price: Number(i.price),
          currency_id: 'ARS',
        })),
        // El envío va como ítem propio: así el total que cobra MP coincide
        // con el total del pedido y el comprador ve el desglose.
        ...(payload.shippingCost > 0
          ? [{
              id: 'shipping',
              title: payload.shippingMethod === 'sucursal'
                ? 'Envío a sucursal de Correo'
                : 'Envío a domicilio',
              quantity: 1,
              unit_price: payload.shippingCost,
              currency_id: 'ARS',
            }]
          : []),
      ],
      // installments limita el máximo de cuotas ofrecidas en el checkout de MP.
      // Que sean SIN INTERÉS depende de la campaña de cuotas configurada en la
      // cuenta de MercadoPago del vendedor — esto solo fija el tope.
      payment_methods: {
        installments,
        default_installments: installments,
      },
      payer: {
        name: payload.customer.name,
        email: payload.customer.email,
        phone: { area_code: '', number: payload.customer.phone },
        address: {
          street_name: payload.customer.address,
          city_name: payload.customer.city,
          zip_code: payload.customer.zip,
        },
      },
      back_urls: {
        success: `${baseUrl}/${tenantSlug}/checkout/success?order=${order.id}`,
        failure: `${baseUrl}/${tenantSlug}/checkout?error=payment_failed`,
        pending: `${baseUrl}/${tenantSlug}/checkout/success?order=${order.id}&pending=1`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/${tenantSlug}/api/webhooks/mercadopago`,
      statement_descriptor: order.number,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MP preference API ${res.status}: ${text}`)
  }

  return res.json()
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { tenant, settings } = await getTenantFromRequest(params.tenant)
    const body: OrderRequest = await request.json()

    if (!body.customer || !Array.isArray(body.items) || body.items.length === 0) {
      return apiError('Payload inválido', 400)
    }

    // Look up product prices from DB — never trust client-provided values
    const productIds = Array.from(new Set(body.items.map((i) => i.productId)))
    const products = await getProductsByIds(productIds, tenant.id)
    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of body.items) {
      if (!productMap.has(item.productId)) {
        return apiError(`Producto ${item.productId} no encontrado`, 422)
      }
    }

    const verifiedItems = body.items.map((item) => {
      const product = productMap.get(item.productId)!
      return {
        productId: product.id,
        productName: product.name,
        productTeam: product.team,
        size: item.size,
        version: item.version,
        quantity: item.quantity,
        price: product.price,
        image: product.images[0] ?? '',
      }
    })

    // Zona y modalidad vienen del navegador; el COSTO se resuelve acá contra
    // store_settings. Si el precio viniera del cliente, cualquiera podría
    // mandar shippingCost: 0 y llevarse el envío gratis.
    if (!isShippingZone(body.shipping?.zone) || !isShippingMethod(body.shipping?.method)) {
      return apiError('Falta elegir la zona y la modalidad de envío', 400)
    }
    const shippingZone = body.shipping.zone
    const shippingMethod = body.shipping.method
    const shipping = shippingCost(settings, shippingZone, shippingMethod)

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    let discount = 0
    let discountCode: string | null = null

    // Atomically claim coupon at order time (single UPDATE that validates + increments)
    if (body.discountCode) {
      const claim = await claimCoupon(body.discountCode, tenant.id)
      if (!claim.valid) {
        return apiError(claim.message, 422)
      }
      discountCode = body.discountCode.toUpperCase().trim()
      if (claim.couponType === 'percent') {
        discount = Math.round((subtotal * claim.discountPercent) / 100 * 100) / 100
      } else if (claim.couponType === 'fixed' && claim.couponValue != null) {
        discount = Math.min(claim.couponValue, subtotal)
      }
    }

    // Descuento por efectivo/transferencia. Se calcula sobre la mercadería ya
    // neteada de cupón y NUNCA sobre el envío — el flete se paga igual.
    if (qualifiesForCashDiscount(body.paymentMethod)) {
      discount += cashDiscountAmount(
        Math.max(0, subtotal - discount),
        Number(settings.cash_discount_percent)
      )
    }

    const payload: CreateOrderPayload = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      orderPrefix: settings.order_prefix,
      customer: body.customer,
      items: verifiedItems,
      subtotal,
      discount,
      discountCode,
      shippingMethod,
      shippingZone,
      shippingCost: shipping,
      total: Math.max(0, subtotal - discount) + shipping,
      paymentMethod: body.paymentMethod,
    }

    const order = await createOrder(payload)

    // For MercadoPago: create a payment preference and return the checkout URL.
    // The preference sets external_reference = order.id so the webhook can map
    // the incoming payment notification back to this specific order and tenant.
    if (body.paymentMethod === 'mercadopago') {
      const accessToken = await getMpAccessToken(tenant.id)
      if (accessToken) {
        try {
          const baseUrl = new URL(request.url).origin
          const preference = await createMpPreference(
            accessToken,
            order,
            payload,
            baseUrl,
            tenant.slug,
            settings.installments
          )
          return NextResponse.json(
            { order, mpInitPoint: preference.init_point },
            { status: 201 }
          )
        } catch (mpErr) {
          // MP preference creation failed — order exists but payment can't proceed.
          // Return the order anyway so the admin can handle it manually.
          console.error('[orders/route] MP preference error:', mpErr)
          return NextResponse.json(
            { order, mpError: 'No se pudo crear la preferencia de pago. Contactá al vendedor.' },
            { status: 201 }
          )
        }
      }
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    console.error('[orders/route] POST error:', err)
    return apiError('Error al crear el pedido', 500)
  }
}
