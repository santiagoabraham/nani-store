import { NextRequest, NextResponse } from 'next/server'
import { getTenantFromRequest } from '@/lib/api-utils'
import { validateCoupon } from '@/lib/db/coupons'

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { tenant } = await getTenantFromRequest(params.tenant)
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Código inválido' })
    }

    // Read-only validation — no side effects. Usage is incremented atomically at order creation.
    const result = await validateCoupon(code, tenant.id)

    return NextResponse.json({
      valid: result.valid,
      message: result.message,
      code: code.toUpperCase().trim(),
      discountPercent: result.discountPercent,
    })
  } catch (err) {
    console.error('[coupons/validate] POST error:', err)
    return NextResponse.json({ valid: false, message: 'Error al validar el cupón' }, { status: 500 })
  }
}
