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
import { getVisiblePerks } from '@/lib/db/perks'
import { iconFor } from '@/lib/icons'

interface Props { params: { tenant: string } }

export default async function StorePage({ params }: Props) {
  const { tenant, settings } = await requireTenant(params.tenant)

  // getStorefrontProducts ya excluye lo que está sin stock,
  // así que ninguna sección de la home necesita filtrar de nuevo.
  const [products, categories, perks] = await Promise.all([
    getStorefrontProducts(tenant.id),
    getVisibleCategories(tenant.id),
    getVisiblePerks(tenant.id, 'home'),
  ])

  const featured = products.slice(0, 4)

  return (
    <>
      <Hero settings={settings} />

      {/* Barra de beneficios — editable desde Contenido en el panel.
          Si no hay ninguno visible la barra entera desaparece, en vez de
          dejar una franja vacía. La grilla se adapta a la cantidad para que
          uno o dos bloques no queden desparramados en cuatro columnas. */}
      {perks.length > 0 && (
        <div className="bg-[#00273E] py-4">
          <div className={`max-w-7xl mx-auto px-4 grid gap-4 ${
            perks.length === 1 ? 'grid-cols-1'
              : perks.length === 2 ? 'grid-cols-2'
              : perks.length === 3 ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-4'
          }`}>
            {perks.map((perk) => {
              const Icon = iconFor(perk.icon)
              return (
                <div key={perk.id} className="flex items-center gap-3">
                  <Icon size={20} className="text-[#029CDC] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-heading text-xs text-white tracking-wider">{perk.label}</p>
                    {perk.sublabel && (
                      <p className="font-body text-xs text-white/50">{perk.sublabel}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <FeaturedProducts products={featured} tenantSlug={params.tenant} />
      <HangingRack products={products} tenantSlug={params.tenant} />
      <CategoryGrid categories={categories} tenantSlug={params.tenant} />
      <AllProducts products={products} tenantSlug={params.tenant} />
      <Reviews />
      <Newsletter settings={settings} />
    </>
  )
}
