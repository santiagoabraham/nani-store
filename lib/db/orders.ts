import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DBOrder, DBOrderItem, CreateOrderPayload, OrderStatus } from '@/types'

export async function getOrdersByTenant(tenantId: string): Promise<DBOrder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DBOrder[]
}

export async function getOrderById(id: string, tenantId: string): Promise<DBOrder | null> {
  // Service client: called from guest checkout (no session) and the MP webhook
  // (server-to-server, no session). Always filtered by tenant_id for isolation.
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !data) return null
  return data as DBOrder
}

export async function createOrder(payload: CreateOrderPayload): Promise<DBOrder> {
  // Service client: INSERT on orders/order_items is revoked from anon/authenticated
  // roles (rls-hardening.sql). All order creation is server-side-only.
  const supabase = createServiceClient()

  // 1. Generate a per-tenant order number atomically.
  //    Using a global sequence leaks business scale to other tenants (tenant A sees
  //    gaps in their own sequence caused by tenant B's orders). The RPC increments
  //    a counter column in store_settings for this tenant only.
  const { data: numberData, error: numberErr } = await supabase.rpc(
    'next_order_number_for_tenant',
    { p_tenant_id: payload.tenantId, p_prefix: payload.orderPrefix }
  )
  if (numberErr || !numberData) throw numberErr ?? new Error('Failed to generate order number')
  const orderNumber: string = numberData

  // 2. Insert the order header
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      tenant_id: payload.tenantId,
      number: orderNumber,
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone,
      customer_address: payload.customer.address,
      customer_city: payload.customer.city,
      customer_state: payload.customer.state,
      customer_zip: payload.customer.zip,
      customer_country: payload.customer.country,
      subtotal: payload.subtotal,
      discount: payload.discount,
      discount_code: payload.discountCode,
      shipping_method: payload.shippingMethod,
      shipping_zone: payload.shippingZone,
      shipping_cost: payload.shippingCost,
      total: payload.total,
      payment_method: payload.paymentMethod,
      status: 'pending',
    })
    .select()
    .single()

  if (orderErr) throw orderErr

  // 2. Insert all line items
  const items: Omit<DBOrderItem, 'id' | 'created_at'>[] = payload.items.map((i) => ({
    order_id: order.id,
    product_id: i.productId,
    product_name: i.productName,
    product_team: i.productTeam,
    size: i.size,
    version: i.version,
    quantity: i.quantity,
    price: i.price,
    image: i.image,
  }))

  const { error: itemsErr } = await supabase.from('order_items').insert(items)
  if (itemsErr) throw itemsErr

  // 3. Return full order with items
  return getOrderById(order.id, payload.tenantId) as Promise<DBOrder>
}

export async function updateOrderStatus(
  id: string,
  tenantId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

/**
 * Atomically transition an order to 'paid'.
 * Uses transition_order_status() — idempotent and forward-only.
 * Safe to call multiple times for the same payment (duplicate webhooks).
 */
export async function markOrderPaid(
  id: string,
  tenantId: string,
  paymentId: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase.rpc('transition_order_status', {
    p_order_id: id,
    p_tenant_id: tenantId,
    p_new_status: 'paid',
    p_payment_id: paymentId,
  })
}

export async function markOrderCancelled(
  id: string,
  tenantId: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase.rpc('transition_order_status', {
    p_order_id: id,
    p_tenant_id: tenantId,
    p_new_status: 'cancelled',
    p_payment_id: null,
  })
}

/**
 * Cola de despacho: pedidos cobrados, con envío, que todavía no salieron.
 *
 * "Cobrado" incluye 'paid' y 'shipped'... no: 'shipped' ya salió. El criterio es
 * status='paid' AND shipped_at IS NULL. Un pedido en 'pending' todavía no se
 * pagó y no hay que empaquetarlo; uno 'cancelled' tampoco.
 *
 * Ordenados del más viejo al más nuevo — el que más esperó va primero.
 */
export async function getOrdersToDispatch(tenantId: string): Promise<DBOrder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('tenant_id', tenantId)
    .eq('status', 'paid')
    .is('shipped_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as DBOrder[]
}

/**
 * Marca un pedido como despachado y guarda el seguimiento.
 *
 * Setea shipped_at además del status: es el campo que saca al pedido de la
 * cola, y guarda la fecha real de despacho independientemente de que después
 * pase a 'delivered'.
 */
export async function markOrderShipped(
  id: string,
  tenantId: string,
  trackingNumber: string
): Promise<DBOrder | null> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: trackingNumber.trim() || null,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
  return getOrderById(id, tenantId)
}

/** Corrige el seguimiento de un pedido ya despachado, sin tocar shipped_at. */
export async function updateTrackingNumber(
  id: string,
  tenantId: string,
  trackingNumber: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber.trim() || null })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

/** Aggregate stats used by the admin dashboard. */
export interface OrderStats {
  totalRevenue: number
  totalOrders: number
  pendingCount: number
  paidCount: number
  shippedCount: number
  deliveredCount: number
  cancelledCount: number
}

export async function getOrderStats(tenantId: string): Promise<OrderStats> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('status, total')
    .eq('tenant_id', tenantId)

  if (error) throw error

  return (data ?? []).reduce<OrderStats>(
    (acc, o) => {
      acc.totalOrders++
      if (o.status !== 'cancelled') acc.totalRevenue += Number(o.total)
      const key = `${o.status}Count` as keyof OrderStats
      if (key in acc) (acc[key] as number)++
      return acc
    },
    { totalRevenue: 0, totalOrders: 0, pendingCount: 0, paidCount: 0, shippedCount: 0, deliveredCount: 0, cancelledCount: 0 }
  )
}
