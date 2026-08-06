'use client'

import { useState, useMemo } from 'react'
import { Product, ProductCategory } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { Filter } from 'lucide-react'

interface Props {
  initialProducts: Product[]
  categories: ProductCategory[]
  tenantSlug: string
  initialCategory?: string
  initialGarment?: string
  initialClub?: string
}

/** Redondea hacia arriba al millar para que el tope del slider sea prolijo. */
const ceilToThousand = (n: number) => Math.ceil(n / 1000) * 1000
const floorToThousand = (n: number) => Math.floor(n / 1000) * 1000

export function ProductsClient({
  initialProducts, categories, tenantSlug,
  initialCategory, initialGarment, initialClub,
}: Props) {
  // Las opciones de cada filtro salen del catálogo real, no de listas fijas:
  // así el filtro nunca ofrece algo que no existe ni esconde algo que sí.
  const { garmentOptions, clubOptions, sizeOptions, priceFloor, priceCeiling } = useMemo(() => {
    const prices = initialProducts.map((p) => p.price)
    const sizes = new Set<string>()
    for (const p of initialProducts) for (const s of p.sizes) sizes.add(s)

    // S/M/L/XL/XXL primero en su orden natural; después los numéricos.
    const ORDER = ['S', 'M', 'L', 'XL', 'XXL']
    const sorted = Array.from(sizes).sort((a, b) => {
      const ia = ORDER.indexOf(a)
      const ib = ORDER.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b, 'es', { numeric: true })
    })

    return {
      garmentOptions: Array.from(
        new Set(initialProducts.map((p) => p.garmentType).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'es')),
      clubOptions: Array.from(
        new Set(initialProducts.map((p) => p.team).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'es')),
      sizeOptions: sorted,
      priceFloor: prices.length ? floorToThousand(Math.min(...prices)) : 0,
      priceCeiling: prices.length ? ceilToThousand(Math.max(...prices)) : 0,
    }
  }, [initialProducts])

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  )
  const [selectedGarments, setSelectedGarments] = useState<string[]>(
    initialGarment ? [initialGarment] : []
  )
  const [selectedClubs, setSelectedClubs] = useState<string[]>(
    initialClub ? [initialClub] : []
  )
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(priceCeiling)
  const [sort, setSort] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let out = [...initialProducts]
    if (selectedCategories.length > 0)
      out = out.filter((p) => selectedCategories.includes(p.category))
    if (selectedGarments.length > 0)
      out = out.filter((p) => selectedGarments.includes(p.garmentType))
    if (selectedClubs.length > 0)
      out = out.filter((p) => selectedClubs.includes(p.team))
    if (selectedSizes.length > 0)
      out = out.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)))
    out = out.filter((p) => p.price <= maxPrice)
    if (sort === 'price-asc') out.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') out.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') out.sort((a, b) => b.rating - a.rating)
    return out
  }, [initialProducts, selectedCategories, selectedGarments, selectedClubs, selectedSizes, maxPrice, sort])

  const activeCount =
    selectedCategories.length + selectedGarments.length +
    selectedClubs.length + selectedSizes.length +
    (maxPrice < priceCeiling ? 1 : 0)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-5xl text-gray-900 tracking-wider">PRODUCTOS</h1>
            <p className="font-body text-sm text-gray-500 mt-1">
              {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="rating">Mejor valorados</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 border border-gray-200 px-3 py-2 font-body text-sm"
            >
              <Filter size={16} />
              Filtros {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-56 flex-shrink-0`}>
            <ProductFilters
              categories={categories}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              garmentOptions={garmentOptions}
              selectedGarments={selectedGarments}
              setSelectedGarments={setSelectedGarments}
              clubOptions={clubOptions}
              selectedClubs={selectedClubs}
              setSelectedClubs={setSelectedClubs}
              sizeOptions={sizeOptions}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              priceFloor={priceFloor}
              priceCeiling={priceCeiling}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
            />
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-heading text-2xl text-gray-300 tracking-wider">SIN RESULTADOS</p>
                <p className="font-body text-sm text-gray-400 mt-2">Probá cambiando los filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
