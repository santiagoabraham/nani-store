import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { updateStoreSettings, updateMpCredentials, updateMpWebhookSecret } from '@/lib/db/settings'
import type { StoreSettings } from '@/types'

export const PATCH = withAdmin<{ params: { tenant: string } }>(
  async (req, { tenant }) => {
    const body = await req.json() as {
      settings?: Partial<Omit<StoreSettings, 'tenant_id'>>
      mpToken?: string
      mpPublicKey?: string
      mpWebhookSecret?: string
    }

    if (body.settings) {
      // Strip any attempt to pass tenant_id or sensitive fields in general settings
      const { tenant_id: _tid, ...safeSettings } = body.settings as StoreSettings
      await updateStoreSettings(tenant.id, safeSettings)
    }

    if (body.mpToken?.trim() && body.mpPublicKey?.trim()) {
      await updateMpCredentials(tenant.id, body.mpToken.trim(), body.mpPublicKey.trim())
    }

    if (body.mpWebhookSecret?.trim()) {
      await updateMpWebhookSecret(tenant.id, body.mpWebhookSecret.trim())
    }

    return NextResponse.json({ ok: true })
  }
)
