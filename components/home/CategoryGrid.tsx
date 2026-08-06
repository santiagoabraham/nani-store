'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProductCategory } from '@/types'
import { ArrowRight, Clock } from 'lucide-react'
import { track } from '@/lib/analytics'

interface Props {
  categories: ProductCategory[]
  tenantSlug: string
}

export function CategoryGrid({ categories, tenantSlug }: Props) {
  return (
    <section className="py-20 bg-carpi-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-2">
              Explorá por categoría
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl text-carpi-ink tracking-wider">
              CATEGORÍAS
            </h2>
          </div>
          <Link
            href={`/${tenantSlug}/products`}
            className="hidden sm:flex items-center gap-2 font-body text-sm text-gray-500 hover:text-carpi-red transition-colors group"
          >
            Ver todas
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => {
            const card = (
              <div className="group relative overflow-hidden aspect-[4/5]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className={`object-cover transition-transform duration-500 ${cat.comingSoon ? '' : 'group-hover:scale-110'}`}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {cat.comingSoon ? (
                  <div className="absolute inset-0 bg-black/40" />
                ) : (
                  <div className="absolute inset-0 bg-carpi-red/0 group-hover:bg-carpi-red/20 transition-colors duration-300" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block font-body text-xs text-white/60 uppercase tracking-widest mb-1">
                    {cat.comingSoon ? 'Próximamente' : `${cat.count} camiseta${cat.count !== 1 ? 's' : ''}`}
                  </span>
                  <h3 className="font-heading text-2xl text-white tracking-wider leading-tight">
                    {cat.name}
                  </h3>
                  <p className="font-body text-xs text-white/70 mt-1">{cat.description}</p>
                  {cat.comingSoon ? (
                    <div className="flex items-center gap-1 mt-3 text-white/60">
                      <Clock size={12} />
                      <span className="font-body text-xs">Muy pronto</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-3 text-white/0 group-hover:text-white/80 transition-colors duration-300">
                      <span className="font-body text-xs">Ver colección</span>
                      <ArrowRight size={12} />
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 font-heading text-5xl text-white/10 leading-none">
                  0{index + 1}
                </div>
              </div>
            )

            return cat.comingSoon ? (
              <div key={cat.id}>{card}</div>
            ) : (
              <Link
                key={cat.id}
                href={`/${tenantSlug}/products?category=${cat.slug}`}
                className="block"
                onClick={() => track('category_clicked', { category: cat.slug, name: cat.name })}
              >
                {card}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
