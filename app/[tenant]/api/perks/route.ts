import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ApiError } from '@/lib/api-utils'
import { createPerk } from '@/lib/db/perks'
import { isContentIcon } from '@/lib/icons'
import type { PerkPayload } from '@/types'

export const POST = withAdmin<{ params: { tenant: string } }>(
  async (req, { tenant }) => {
    const body: PerkPayload = await (req as NextRequest).json()

    const label = body.label?.trim()
    if (!label) throw new ApiError('El texto principal es obligatorio', 400)

    if (body.location !== 'home' && body.location !== 'product') {
      throw new ApiError('Ubicación inválida', 400)
    }

    // El ícono se valida contra el registro curado: si llegara un nombre
    // desconocido, la vitrina caería en el ícono por defecto sin avisar.
    const icon = isContentIcon(body.icon) ? body.icon : 'CheckCircle'

    const perk = await createPerk(tenant.id, {
      location: body.location,
      icon,
      label,
      sublabel: body.sublabel?.trim() ?? '',
      visible: body.visible ?? true,
      sort_order: body.sort_order ?? 0,
    })

    return NextResponse.json({ perk }, { status: 201 })
  }
)
