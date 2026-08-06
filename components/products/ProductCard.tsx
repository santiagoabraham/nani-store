'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ImageOff } from 'lucide-react'
import { Product } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { useCart } from '@/store/cartStore'
import { formatPriceARS } from '@/lib/utils'
import { track } from '@/lib/analytics'

interface ProductCardProps {
  product: Product
  tenantSlug: string
}

export function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const { addItem } = useCart()

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    const size = product.sizes[2] ?? product.sizes[0]
    const version = product.availableVersions[0]
    addItem(product, size, version)
    track('product_quick_added', {
      product_id: product.id,
      product_name: product.name,
      team: product.team,
      category: product.category,
      size,
      version,
      price: product.price,
    })
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <Link href={`/${tenantSlug}/products/${product.slug}`} className="group block">
      <div className="bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-carpi-gray">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={`${product.team} - ${product.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            // next/image revienta con src undefined: un producto sin foto
            // rompía la grilla entera en vez de degradar a un placeholder.
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
              <ImageOff size={28} />
              <span className="font-body text-xs">Sin imagen</span>
            </div>
          )}
          {product.badge && (
            <div className="absolute top-3 left-3">
              <Badge type={product.badge} />
            </div>
          )}
          {discount && (
            <div className="absolute top-3 right-3 bg-carpi-red text-white font-heading text-sm px-2 py-1">
              -{discount}%
            </div>
          )}
          {/* Quick add overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-carpi-navy text-white font-heading tracking-widest text-sm py-3 flex items-center justify-center gap-2 hover:bg-carpi-red transition-colors duration-200"
            >
              <ShoppingCart size={16} />
              AGREGAR AL CARRITO
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-carpi-muted font-body uppercase tracking-wider mb-1">
            {product.team}
          </p>
          <h3 className="font-heading text-xl text-carpi-ink leading-tight mb-2">
            {product.name}
          </h3>
          <StarRating rating={product.rating} reviewCount={product.reviewCount} className="mb-3" />
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl text-carpi-ink">{formatPriceARS(product.price)}</span>
            {product.originalPrice && (
              <span className="font-body text-sm text-gray-400 line-through">
                {formatPriceARS(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
