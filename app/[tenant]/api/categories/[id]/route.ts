import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ApiError } from '@/lib/api-utils'
import { updateCategory, deleteCategory } from '@/lib/db/settings'
import type { CategoryPayload } from '@/types'

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body: Partial<CategoryPayload> = await (req as NextRequest).json()

    // El slug no se toca al renombrar: las URLs y los links compartidos
    // (/products?category=equipos) siguen funcionando.
    const patch: Parameters<typeof updateCategory>[2] = {}
    if (body.name !== undefined) {
      const name = body.name.trim()
      if (!name) throw new ApiError('El nombre no puede quedar vacío', 400)
      patch.name = name
    }
    if (body.description !== undefined) patch.description = body.description.trim()
    if (body.visible !== undefined) patch.visible = body.visible
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order

    const category = await updateCategory(params.id, tenant.id, patch)
    return NextResponse.json({ category })
  }
)

export const DELETE = withAdmin<{ params: { tenant: string; id: string } }>(
  async (_req, { tenant, params }) => {
    try {
      await deleteCategory(params.id, tenant.id)
    } catch (e) {
      // deleteCategory frena el borrado si la categoría todavía tiene
      // productos, para no dejarlos sin categoría en silencio.
      if (e instanceof Error && e.message.includes('producto')) {
        throw new ApiError(e.message, 409)
      }
      throw e
    }
    return NextResponse.json({ ok: true })
  }
)
