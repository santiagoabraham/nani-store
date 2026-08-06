import { requireTenant } from '@/lib/tenant'
import { getStorefrontProducts } from '@/lib/db/products'
import { getVisibleCategories } from '@/lib/db/settings'
import { Hero } from '@/components/home/Hero'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { HangingRack } from '@/components/home/HangingRack'
import { AllProducts } from '@/components/home/AllProducts'
import { Reviews } from '@/components/home/Reviews'
import { Newsletter } from '@/components/home/Newsletter'
import { reviews as staticReviews } from '@/lib/data'
import { CheckCircle, Truck, Award, Headphones } from 'lucide-react'

interface Props { params: { tenant: string } }

export default async function StorePage({ params }: Props) {
  const { tenant, settings } = await requireTenant(params.tenant)

  // getStorefrontProducts ya excluye lo que está sin stock,
  // así que ninguna sección de la home necesita filtrar de nuevo.
  const [products, categories] = await Promise.all([
    getStorefrontProducts(tenant.id),
    getVisibleCategories(tenant.id),
  ])

  const featured = products.slice(0, 4)

  return (
    <>
      <Hero settings={settings} />

      {/* Perks bar */}
      <div className="bg-[#00273E] py-4">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck,       label: 'ENVÍO A TODO EL PAÍS', sub: 'Por Correo Argentino' },
            { icon: Award,       label: 'PRODUCTO GARANTIZADO', sub: 'Calidad certificada' },
            { icon: CheckCircle, label: 'DEVOLUCIÓN GRATIS', sub: '30 días' },
            { icon: Headphones,  label: 'SOPORTE 24/7', sub: 'Siempre disponibles' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={20} className="text-[#029CDC] flex-shrink-0" />
              <div>
                <p className="font-heading text-xs text-white tracking-wider">{label}</p>
                <p className="font-body text-xs text-white/50">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FeaturedProducts products={featured} tenantSlug={params.tenant} />
      <HangingRack products={products} tenantSlug={params.tenant} />
      <CategoryGrid categories={categories} tenantSlug={params.tenant} />
      <AllProducts products={products} tenantSlug={params.tenant} />
      <Reviews />
      <Newsletter settings={settings} />
    </>
  )
}
