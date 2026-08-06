import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { createProduct } from '@/lib/db/products'
import { ProductInsert } from '@/types'

export const POST = withAdmin<{ params: { tenant: string } }>(
  async (req, { tenant }) => {
    const body: ProductInsert = await (req as NextRequest).json()
    const product = await createProduct(tenant.id, body)
    return NextResponse.json({ product }, { status: 201 })
  }
)
