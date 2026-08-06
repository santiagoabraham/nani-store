'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Share2, ChevronRight, CheckCircle, ChevronDown, ChevronUp, Truck, Shield, RotateCcw, ImageOff, CreditCard, Banknote } from 'lucide-react'
import { Product, Size, JerseyVersion } from '@/types'
import { useCart } from '@/store/cartStore'
import { useTenant } from '@/context/TenantContext'
import { paymentTerms, cashPrice, installmentAmount } from '@/lib/pricing'
import { formatPriceARS } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { SizeSelector } from '@/components/products/SizeSelector'
import { VersionSelector } from '@/components/products/VersionSelector'
import { StarRating } from '@/components/ui/StarRating'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/products/ProductCard'

const VERSION_LABELS: Record<JerseyVersion, string> = {
  Home: 'Titular',
  Away: 'Alternativa',
  Third: 'Tercera',
}

interface ProductDetailClientProps {
  product: Product
  related: Product[]
  tenantSlug: string
}

export function ProductDetailClient({ product, related, tenantSlug }: ProductDetailClientProps) {
  const { addItem } = useCart()
  const { settings } = useTenant()
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    track('product_viewed', {
      product_id: product.id,
      product_name: product.name,
      team: product.team,
      category: product.category,
      price: product.price,
    })
  }, [product.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<JerseyVersion>(product.availableVersions[0])
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [showShipping, setShowShipping] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  // Condiciones de pago de la tienda: se editan en Configuración,
  // así que cambiar el 10% se refleja en todos los productos a la vez.
  const terms = paymentTerms(settings)
  const perInstallment = installmentAmount(product.price, terms.installments)
  const priceInCash = cashPrice(product.price, terms.cashDiscountPercent)

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2000)
      return
    }
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, selectedVersion)
    }
    track('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      team: product.team,
      category: product.category,
      size: selectedSize,
      version: selectedVersion,
      quantity,
      price: product.price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-carpi-gray border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs font-body text-gray-400">
          <Link href={`/${tenantSlug}`} className="hover:text-carpi-red transition-colors">Inicio</Link>
          <ChevronRight size={12} />
          <Link href={`/${tenantSlug}/products`} className="hover:text-carpi-red transition-colors">Camisetas</Link>
          <ChevronRight size={12} />
          <span className="text-carpi-ink">{product.team}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-carpi-gray overflow-hidden">
              {product.images[selectedImage] ?? product.images[0] ? (
                <Image
                  src={product.images[selectedImage] ?? product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                  <ImageOff size={40} />
                  <span className="font-body text-sm">Sin imagen</span>
                </div>
              )}
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <Badge type={product.badge} />
                </div>
              )}
              {discount && (
                <div className="absolute top-4 right-4 bg-carpi-red text-white font-heading text-lg px-3 py-1">
                  -{discount}%
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-24 bg-carpi-gray overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-carpi-red' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image src={img} alt={`Vista ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-body text-xs uppercase tracking-widest text-white bg-carpi-navy px-3 py-1">
                {product.league}
              </span>
              <span className="font-body text-xs text-gray-400">{product.team}</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl text-carpi-ink tracking-wider leading-tight mb-3">
              {product.team.toUpperCase()}
            </h1>
            <h2 className="font-heading text-2xl text-gray-500 tracking-wider mb-4">
              {product.name.toUpperCase()}
            </h2>

            <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" className="mb-5" />

            {/* Precio */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-heading text-5xl text-carpi-ink">{formatPriceARS(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="font-body text-xl text-gray-400 line-through">
                    {formatPriceARS(product.originalPrice)}
                  </span>
                  <span className="font-heading text-lg text-carpi-red">
                    Ahorrás {formatPriceARS(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Las dos formas de pago, con su precio final */}
            <div className="border border-gray-200 divide-y divide-gray-100 mb-8">
              <div className="flex items-center gap-3 px-4 py-3">
                <CreditCard size={18} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-heading text-lg text-carpi-ink leading-tight">
                    {terms.installments} cuotas sin interés de {formatPriceARS(perInstallment)}
                  </p>
                  <p className="font-body text-xs text-gray-500">
                    Con tarjeta por MercadoPago — total {formatPriceARS(product.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50">
                <Banknote size={18} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-heading text-lg text-emerald-700 leading-tight">
                    {formatPriceARS(priceInCash)}
                  </p>
                  <p className="font-body text-xs text-gray-500">
                    Efectivo o transferencia — {terms.cashDiscountPercent}% off,
                    ahorrás {formatPriceARS(product.price - priceInCash)}
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de versión */}
            {product.availableVersions.length > 1 && (
              <div className="mb-6">
                <p className="font-heading tracking-wider text-sm text-gray-500 mb-3">
                  VERSIÓN:{' '}
                  <span className="text-carpi-ink">{VERSION_LABELS[selectedVersion]}</span>
                </p>
                <VersionSelector
                  versions={product.availableVersions}
                  selected={selectedVersion}
                  onSelect={setSelectedVersion}
                />
              </div>
            )}

            {/* Selector de talle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className={`font-heading tracking-wider text-sm ${sizeError ? 'text-carpi-red' : 'text-gray-500'}`}>
                  {sizeError ? '⚠ SELECCIONÁ UN TALLE' : `TALLE: ${selectedSize ?? 'Elegí tu talle'}`}
                </p>
                <button className="font-body text-xs text-carpi-red underline">Guía de talles</button>
              </div>
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onSelect={(size) => { setSelectedSize(size); setSizeError(false) }}
              />
            </div>

            {/* Cantidad + Agregar */}
            <div className="flex gap-3 mb-8">
              <div className="flex items-center border-2 border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-14 flex items-center justify-center text-gray-500 hover:text-carpi-red transition-colors text-xl font-light"
                >
                  −
                </button>
                <span className="w-10 text-center font-heading text-xl">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-14 flex items-center justify-center text-gray-500 hover:text-carpi-red transition-colors text-xl font-light"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-3 font-heading tracking-widest text-base h-14 transition-all duration-300 ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-carpi-red text-white hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {added ? (
                  <><CheckCircle size={18} /> AGREGADO AL CARRITO</>
                ) : (
                  <><ShoppingCart size={18} /> AGREGAR AL CARRITO</>
                )}
              </button>
              <button className="w-14 h-14 border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-carpi-red hover:text-carpi-red transition-colors">
                <Heart size={18} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Truck, label: 'Envío a todo el país', sub: 'Correo Argentino' },
                { icon: Shield, label: 'Autenticidad', sub: 'Garantizada' },
                { icon: RotateCcw, label: 'Devolución', sub: '30 días gratis' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-carpi-gray">
                  <Icon size={18} className="text-carpi-red mb-1" />
                  <p className="font-heading text-xs tracking-wider text-carpi-ink">{label}</p>
                  <p className="font-body text-xs text-gray-400">{sub}</p>
                </div>
              ))}
            </div>

            {/* Acordeones */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-between w-full py-4 border-b border-gray-100"
              >
                <span className="font-heading tracking-wider text-carpi-ink">DESCRIPCIÓN</span>
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showDetails && (
                <div className="py-4 border-b border-gray-100">
                  <p className="font-body text-sm text-gray-600 leading-relaxed mb-4">
                    {product.description}
                  </p>
                  <ul className="space-y-2">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 font-body text-sm text-gray-600">
                        <CheckCircle size={14} className="text-carpi-red flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => setShowShipping(!showShipping)}
                className="flex items-center justify-between w-full py-4"
              >
                <span className="font-heading tracking-wider text-carpi-ink">ENVÍOS Y DEVOLUCIONES</span>
                {showShipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showShipping && (
                // Las tarifas salen de settings, no escritas a mano: si las
                // cambiás en el panel, este bloque cambia con ellas.
                <div className="pb-4 font-body text-sm text-gray-600 space-y-2">
                  <p>
                    ✓ Capital Federal y GBA — a domicilio{' '}
                    <strong>{formatPriceARS(Number(settings.ship_home_caba))}</strong>, a sucursal{' '}
                    <strong>{formatPriceARS(Number(settings.ship_branch_caba))}</strong>
                  </p>
                  <p>
                    ✓ Resto del país — a domicilio{' '}
                    <strong>{formatPriceARS(Number(settings.ship_home_rest))}</strong>, a sucursal{' '}
                    <strong>{formatPriceARS(Number(settings.ship_branch_rest))}</strong>
                  </p>
                  <p>✓ Envíos por Correo Argentino con número de seguimiento</p>
                  <p>✓ Devoluciones gratis dentro de los <strong>30 días</strong></p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
              <button className="flex items-center gap-2 font-body text-xs text-gray-400 hover:text-carpi-red transition-colors">
                <Share2 size={14} /> Compartir
              </button>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="mb-8">
              <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-2">
                También te puede gustar
              </p>
              <h3 className="font-heading text-4xl text-carpi-ink tracking-wider">
                PRODUCTOS RELACIONADOS
              </h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
