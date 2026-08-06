import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { updateProduct, deleteProduct } from '@/lib/db/products'
import { ProductInsert } from '@/types'

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body: Partial<ProductInsert> = await (req as NextRequest).json()
    const product = await updateProduct(params.id, tenant.id, body)
    return NextResponse.json({ product })
  }
)

export const DELETE = withAdmin<{ params: { tenant: string; id: string } }>(
  async (_req, { tenant, params }) => {
    await deleteProduct(params.id, tenant.id)
    return NextResponse.json({ ok: true })
  }
)
