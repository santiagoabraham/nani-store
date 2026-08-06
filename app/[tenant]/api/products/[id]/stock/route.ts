import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { toggleProductStock } from '@/lib/db/products'

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const { inStock } = await req.json()
    await toggleProductStock(params.id, tenant.id, Boolean(inStock))
    return NextResponse.json({ ok: true })
  }
)
