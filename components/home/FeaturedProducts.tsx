'use client'

import Link from 'next/link'
import { Product } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { ArrowRight } from 'lucide-react'

interface Props {
  products: Product[]
  tenantSlug: string
}

export function FeaturedProducts({ products, tenantSlug }: Props) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-2">
              Las más vendidas
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl text-carpi-ink tracking-wider">
              PRODUCTOS DESTACADOS
            </h2>
            <div className="w-16 h-1 bg-carpi-red mt-3" />
          </div>
          <Link
            href={`/${tenantSlug}/products`}
            className="hidden sm:flex items-center gap-2 font-body text-sm text-gray-500 hover:text-carpi-red transition-colors group"
          >
            Ver todas
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} tenantSlug={tenantSlug} />
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link
            href={`/${tenantSlug}/products`}
            className="inline-flex items-center gap-2 font-heading text-lg tracking-wider text-carpi-red"
          >
            VER TODAS LAS CAMISETAS <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
