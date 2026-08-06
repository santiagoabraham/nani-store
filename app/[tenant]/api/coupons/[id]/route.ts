import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { updateCoupon, deleteCoupon } from '@/lib/db/coupons'
import { CouponInsert } from '@/types'

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body: Partial<CouponInsert> & { active?: boolean } = await (req as NextRequest).json()
    const coupon = await updateCoupon(params.id, tenant.id, body)
    return NextResponse.json({ coupon })
  }
)

export const DELETE = withAdmin<{ params: { tenant: string; id: string } }>(
  async (_req, { tenant, params }) => {
    await deleteCoupon(params.id, tenant.id)
    return NextResponse.json({ ok: true })
  }
)
