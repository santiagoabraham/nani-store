import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ApiError } from '@/lib/api-utils'
import { updatePerk, deletePerk } from '@/lib/db/perks'
import { isContentIcon } from '@/lib/icons'
import type { PerkPayload } from '@/types'

export const PATCH = withAdmin<{ params: { tenant: string; id: string } }>(
  async (req, { tenant, params }) => {
    const body: PerkPayload = await (req as NextRequest).json()

    const patch: PerkPayload = {}
    if (body.label !== undefined) {
      const label = body.label.trim()
      if (!label) throw new ApiError('El texto principal no puede quedar vacío', 400)
      patch.label = label
    }
    if (body.sublabel !== undefined) patch.sublabel = body.sublabel.trim()
    if (body.visible !== undefined) patch.visible = body.visible
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order
    if (body.icon !== undefined) {
      if (!isContentIcon(body.icon)) throw new ApiError('Ícono desconocido', 400)
      patch.icon = body.icon
    }

    const perk = await updatePerk(params.id, tenant.id, patch)
    return NextResponse.json({ perk })
  }
)

export const DELETE = withAdmin<{ params: { tenant: string; id: string } }>(
  async (_req, { tenant, params }) => {
    await deletePerk(params.id, tenant.id)
    return NextResponse.json({ ok: true })
  }
)
