'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/types'
import { formatPriceARS } from '@/lib/utils'

interface Props {
  products: Product[]
  tenantSlug: string
}

/** Recortes con fondo transparente para el perchero (fallback: foto original). */
const RACK_IMAGES: Record<string, string> = {
  'musculosa-basquet-kappa-titular': '/products/rack-musculosa-kappa-blanca.png',
  'musculosa-basquet-kappa-alternativa': '/products/rack-musculosa-kappa-azul.png',
  'musculosa-basquet-kappa-andar-retro': '/products/rack-musculosa-kappa-andar.png',
  'buzo-kappa-celeste-retro': '/products/rack-buzo-kappa-celeste.png',
  'remera-entrenamiento-kappa': '/products/rack-remera-kappa.png',
}

/** Rotación común del estante: todas las prendas miran al mismo lado. */
const RACK_ANGLE = 35
/** Separación en profundidad entre prendas. */
const DEPTH_STEP = 95

/** Curva ease-out pronunciada: arranca rápido (agarrás la percha) y frena suave. */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function HangingRack({ products, tenantSlug }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const items = products.slice(0, 5)
  const current = selected !== null ? items[selected] : null

  return (
    <section className="py-20 bg-carpi-navy overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-2">
            Directo del perchero
          </p>
          <h2 className="font-heading text-5xl sm:text-6xl text-white tracking-wider">
            DESCOLGÁ LA TUYA
          </h2>
          <p className="font-body text-white/50 mt-3 max-w-md mx-auto">
            Tocá una prenda para verla de cerca. Tocala de nuevo para colgarla.
          </p>
        </div>

        {/* Escenario 3D: fila diagonal que se pierde hacia el fondo */}
        <div
          className="flex justify-center items-start pt-2 pb-6 pl-6 sm:pl-10"
          style={{ perspective: '1400px', perspectiveOrigin: '28% 32%' }}
        >
          {items.map((p, i) => {
            const isSelected = selected === i
            const anySelected = selected !== null

            // Posición base en el estante: misma rotación para todas,
            // cada una un paso más atrás (la perspectiva las achica sola).
            const base = `translateZ(${-i * DEPTH_STEP}px) rotateY(${RACK_ANGLE}deg)`

            // La elegida viene hacia el usuario y casi se endereza;
            // las demás acompañan apenas — el estante entero se mueve.
            const transform = isSelected
              ? `translateZ(${-i * DEPTH_STEP + 230}px) rotateY(${RACK_ANGLE - 27}deg) translateY(14px) scale(1.05)`
              : anySelected
                ? `translateZ(${-i * DEPTH_STEP + 35}px) rotateY(${RACK_ANGLE}deg) scale(1.01)`
                : base

            // drop-shadow sigue la silueta del PNG; crece y se difumina al acercarse.
            const shadow = isSelected
              ? 'drop-shadow(0 50px 34px rgba(0,0,0,0.65)) drop-shadow(0 0 26px rgba(2,156,220,0.30))'
              : anySelected
                ? 'drop-shadow(0 22px 16px rgba(0,0,0,0.55))'
                : 'drop-shadow(0 14px 10px rgba(0,0,0,0.5))'

            return (
              <div
                key={p.id}
                className={`relative pointer-events-none ${i === 0 ? '' : '-ml-14 sm:-ml-20 lg:-ml-24'}`}
                style={{
                  transformStyle: 'preserve-3d',
                  zIndex: isSelected ? 50 : 30 - i,
                }}
              >
                {/* Riel iluminado del que cuelga la percha (queda en ángulo con el estante) */}
                <div
                  aria-hidden="true"
                  className="mx-auto mb-2 h-1.5 w-14 sm:w-20 rounded-full"
                  style={{
                    transform: `${base} translateY(-4px)`,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.35))',
                    boxShadow: '0 0 14px rgba(255,255,255,0.55), 0 0 30px rgba(2,156,220,0.35)',
                    opacity: isSelected ? 0.35 : 0.85,
                    transition: 'opacity 0.4s ease',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setSelected(isSelected ? null : i)}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Colgar ${p.name}` : `Ver de cerca ${p.name}`}
                  className="block w-44 sm:w-56 lg:w-64 pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-carpi-red"
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'top center',
                    transform,
                    transition: `transform 0.65s ${EASE}, filter 0.65s ${EASE}`,
                    filter: shadow,
                  }}
                >
                  {/* Zona clickeable acotada a la prenda: los huecos transparentes
                      dejan pasar el click a la prenda de atrás */}
                  <span className="absolute left-[15%] right-[15%] top-[5%] bottom-[10%] pointer-events-auto cursor-pointer" style={{ zIndex: 2 }} />
                  <span className="relative block aspect-[3/4]">
                    <Image
                      src={RACK_IMAGES[p.slug] ?? p.images[0] ?? '/logo.png'}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 260px"
                      className="object-contain"
                      unoptimized
                    />
                    {p.badge && (
                      <span className="absolute top-8 left-1 bg-carpi-red text-white font-heading text-[10px] tracking-wider px-2 py-0.5">
                        {p.badge === 'New' ? 'NUEVO' : p.badge === 'Sale' ? 'OFERTA' : 'LIMITADO'}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        {/* Ficha de la prenda descolgada */}
        <div
          className="text-center min-h-[120px]"
          style={{
            transition: 'opacity 0.45s ease',
            opacity: current ? 1 : 0,
            pointerEvents: current ? 'auto' : 'none',
          }}
        >
          {current && (
            <>
              <p className="font-heading text-white text-2xl tracking-wider leading-tight">
                {current.name}
              </p>
              <p className="font-heading text-carpi-red text-3xl mt-1">
                {formatPriceARS(current.price)}
              </p>
              <Link
                href={`/${tenantSlug}/products/${current.slug}`}
                className="inline-flex items-center gap-2 mt-2 font-body text-sm text-white/80 hover:text-carpi-red transition-colors"
              >
                Ver producto <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
