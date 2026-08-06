import { requireTenant } from '@/lib/tenant'
import { getVisibleCategories } from '@/lib/db/settings'
import { CartStoreProvider } from '@/store/cartStore'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { PageTracker } from '@/components/analytics/PageTracker'

interface Props {
  children: React.ReactNode
  params: { tenant: string }
}

/**
 * Layout de la vitrina: header, footer y carrito.
 *
 * Es un route group — los paréntesis no aparecen en la URL, así que
 * /{tenant} y /{tenant}/products siguen igual. Lo que cambia es que
 * /{tenant}/admin queda afuera y ya no hereda esta cáscara.
 */
export default async function StorefrontLayout({ children, params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const categories = await getVisibleCategories(tenant.id)

  return (
    <CartStoreProvider tenantSlug={params.tenant}>
      <PageTracker />
      <Header categories={categories} />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </CartStoreProvider>
  )
}
