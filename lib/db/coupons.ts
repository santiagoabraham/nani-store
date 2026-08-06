import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DBCoupon, DiscountType } from '@/types'

export async function getCouponsByTenant(tenantId: string): Promise<DBCoupon[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DBCoupon[]
}

export interface CouponValidation {
  valid: boolean
  message: string
  discountPercent: number
  coupon: DBCoupon | null
}

export async function validateCoupon(
  code: string,
  tenantId: string
): Promise<CouponValidation> {
  // Service client: coupons_tenant_scoped_read requires an authenticated session,
  // which anonymous checkout users do not have. Server-side validation always
  // filters by tenantId in the query, so bypassing RLS here is safe.
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) {
    return { valid: false, message: 'Cupón inválido o expirado', discountPercent: 0, coupon: null }
  }

  const coupon = data as DBCoupon

  if (!coupon.active) {
    return { valid: false, message: 'Este cupón está desactivado', discountPercent: 0, coupon: null }
  }

  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses) {
    return { valid: false, message: 'Este cupón ya alcanzó el límite de usos', discountPercent: 0, coupon: null }
  }

  const discountPercent = coupon.type === 'percent' ? coupon.value : 0

  return {
    valid: true,
    message: `¡${coupon.value}${coupon.type === 'percent' ? '%' : ' ARS'} de descuento aplicado!`,
    discountPercent,
    coupon,
  }
}

export async function incrementCouponUses(code: string, tenantId: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('increment_coupon_uses', { p_code: code, p_tenant_id: tenantId })
}

export interface ClaimCouponResult {
  valid: boolean
  discountPercent: number
  couponType: string | null
  couponValue: number | null
  message: string
}

/**
 * Atomically validate AND increment the coupon in a single DB operation.
 * Must be called only at order creation, never at cart/validation time.
 * Uses service client so it works for both authenticated and guest checkouts.
 */
export async function claimCoupon(
  code: string,
  tenantId: string
): Promise<ClaimCouponResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('claim_coupon', {
    p_code: code,
    p_tenant_id: tenantId,
  })

  if (error || !data || !data[0]) {
    return { valid: false, discountPercent: 0, couponType: null, couponValue: null, message: 'Error al aplicar el cupón' }
  }

  const row = data[0]
  return {
    valid: Boolean(row.valid),
    discountPercent: Number(row.discount_percent ?? 0),
    couponType: row.coupon_type ?? null,
    couponValue: row.coupon_value != null ? Number(row.coupon_value) : null,
    message: row.message ?? '',
  }
}

export interface CouponInsert {
  code: string
  type: DiscountType
  value: number
  active?: boolean
  max_uses?: number | null
}

export async function createCoupon(tenantId: string, data: CouponInsert): Promise<DBCoupon> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('coupons')
    .insert({ ...data, tenant_id: tenantId, code: data.code.toUpperCase().trim() })
    .select()
    .single()

  if (error) throw error
  return row as DBCoupon
}

export async function updateCoupon(
  id: string,
  tenantId: string,
  data: Partial<CouponInsert> & { active?: boolean; uses?: number }
): Promise<DBCoupon> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('coupons')
    .update(data)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) throw error
  return row as DBCoupon
}

export async function deleteCoupon(id: string, tenantId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
