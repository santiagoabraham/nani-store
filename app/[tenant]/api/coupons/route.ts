import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { createCoupon } from '@/lib/db/coupons'
import { CouponInsert } from '@/types'

export const POST = withAdmin<{ params: { tenant: string } }>(
  async (req, { tenant }) => {
    const body: CouponInsert = await (req as NextRequest).json()
    const coupon = await createCoupon(tenant.id, body)
    return NextResponse.json({ coupon }, { status: 201 })
  }
)
