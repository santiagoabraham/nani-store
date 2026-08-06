import { requireTenant } from '@/lib/tenant'
import { StoreSettingsForm } from '@/components/admin/StoreSettingsForm'

interface Props { params: { tenant: string } }

export default async function AdminSettingsPage({ params }: Props) {
  const { tenant, settings } = await requireTenant(params.tenant)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-2">CONFIGURACIÓN</h1>
      <p className="font-body text-sm text-gray-500 mb-8">Ajustes de branding, pagos y contenido de {tenant.name}</p>
      <StoreSettingsForm
        tenantId={tenant.id}
        tenantSlug={params.tenant}
        initialSettings={settings}
      />
    </div>
  )
}
