import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ApiError } from '@/lib/api-utils'
import { createCategory } from '@/lib/db/settings'
import { slugify } from '@/lib/utils'
import type { CategoryPayload } from '@/types'

export const POST = withAdmin<{ params: { tenant: string } }>(
  async (req, { tenant }) => {
    const body: CategoryPayload = await (req as NextRequest).json()

    const name = body.name?.trim()
    if (!name) throw new ApiError('El nombre es obligatorio', 400)

    const slug = slugify(body.slug?.trim() || name)
    if (!slug) throw new ApiError('El nombre no genera un slug válido', 400)

    try {
      const category = await createCategory(tenant.id, {
        slug,
        name,
        description: body.description?.trim() ?? '',
        visible: body.visible ?? true,
        sort_order: body.sort_order ?? 0,
      })
      return NextResponse.json({ category }, { status: 201 })
    } catch (e) {
      // UNIQUE (tenant_id, slug): el nombre choca con una categoría que ya
      // existe — puede estar oculta, y por eso no verse en la lista.
      if (typeof e === 'object' && e !== null && 'code' in e && e.code === '23505') {
        throw new ApiError(`Ya existe una categoría con el slug "${slug}".`, 409)
      }
      throw e
    }
  }
)
