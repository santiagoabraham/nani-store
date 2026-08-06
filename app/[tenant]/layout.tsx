import { requireTenant } from '@/lib/tenant'
import { TenantProvider } from '@/context/TenantContext'
import type { Metadata } from 'next'

interface Props {
  children: React.ReactNode
  params: { tenant: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { settings } = await requireTenant(params.tenant)
    return {
      title: {
        default: settings.store_name,
        template: `%s | ${settings.store_name}`,
      },
      description: settings.hero_subtitle || `${settings.store_name} — Camisetas de fútbol`,
    }
  } catch {
    return { title: 'Tienda' }
  }
}

/**
 * Layout raíz de todo lo que cuelga de /{tenant}: vitrina Y panel admin.
 *
 * Sólo resuelve el tenant y lo publica por contexto. El header, el footer
 * y el carrito viven en (storefront)/layout.tsx, no acá: si estuvieran acá
 * el panel admin heredaría la barra de compra fija encima del dashboard.
 */
export default async function TenantLayout({ children, params }: Props) {
  const ctx = await requireTenant(params.tenant)

  return <TenantProvider value={ctx}>{children}</TenantProvider>
}
