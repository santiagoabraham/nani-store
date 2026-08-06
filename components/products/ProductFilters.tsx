'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCategory } from '@/types'

interface Props {
  categories: ProductCategory[]
  selectedCategories: string[]
  setSelectedCategories: (v: string[]) => void
  /** Prendas presentes en el catálogo — no la lista completa. */
  garmentOptions: string[]
  selectedGarments: string[]
  setSelectedGarments: (v: string[]) => void
  /** Clubes presentes en el catálogo, ordenados alfabéticamente. */
  clubOptions: string[]
  selectedClubs: string[]
  setSelectedClubs: (v: string[]) => void
  /** Talles presentes en el catálogo, incluidos los numéricos. */
  sizeOptions: string[]
  selectedSizes: string[]
  setSelectedSizes: (v: string[]) => void
  priceFloor: number
  priceCeiling: number
  maxPrice: number
  setMaxPrice: (v: number) => void
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <span className="font-heading tracking-wider text-lg text-carpi-ink">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && children}
    </div>
  )
}

/** Checkbox genérico reutilizado por Categoría, Prenda y Club. */
function CheckboxList({
  options, selected, onToggle, scroll = false,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  scroll?: boolean
}) {
  return (
    <div className={cn('space-y-2', scroll && 'max-h-56 overflow-y-auto pr-1')}>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => onToggle(opt.value)}
            className="w-4 h-4 accent-carpi-red flex-shrink-0"
          />
          <span className="font-body text-sm text-gray-700 group-hover:text-carpi-red transition-colors">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export function ProductFilters({
  categories,
  selectedCategories, setSelectedCategories,
  garmentOptions, selectedGarments, setSelectedGarments,
  clubOptions, selectedClubs, setSelectedClubs,
  sizeOptions, selectedSizes, setSelectedSizes,
  priceFloor, priceCeiling, maxPrice, setMaxPrice,
}: Props) {
  const toggleIn = (list: string[], setList: (v: string[]) => void) => (value: string) =>
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  const hasActive =
    selectedCategories.length > 0 || selectedGarments.length > 0 ||
    selectedClubs.length > 0 || selectedSizes.length > 0 ||
    maxPrice < priceCeiling

  const clearAll = () => {
    setSelectedCategories([])
    setSelectedGarments([])
    setSelectedClubs([])
    setSelectedSizes([])
    setMaxPrice(priceCeiling)
  }

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl tracking-wider text-carpi-ink">FILTRAR POR</h2>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-xs text-carpi-red flex items-center gap-1 font-body hover:underline"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <FilterSection title="CATEGORÍA">
          <CheckboxList
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
            selected={selectedCategories}
            onToggle={toggleIn(selectedCategories, setSelectedCategories)}
          />
        </FilterSection>
      )}

      {garmentOptions.length > 1 && (
        <FilterSection title="PRENDA">
          <CheckboxList
            options={garmentOptions.map((g) => ({ value: g, label: g }))}
            selected={selectedGarments}
            onToggle={toggleIn(selectedGarments, setSelectedGarments)}
          />
        </FilterSection>
      )}

      {clubOptions.length > 1 && (
        <FilterSection title="CLUB">
          <CheckboxList
            options={clubOptions.map((c) => ({ value: c, label: c }))}
            selected={selectedClubs}
            onToggle={toggleIn(selectedClubs, setSelectedClubs)}
            scroll
          />
        </FilterSection>
      )}

      {sizeOptions.length > 0 && (
        <FilterSection title="TALLE">
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => toggleIn(selectedSizes, setSelectedSizes)(size)}
                className={cn(
                  'min-w-[2.75rem] px-2 h-11 font-heading text-sm border-2 transition-all duration-150',
                  selectedSizes.includes(size)
                    ? 'border-carpi-red bg-carpi-red text-white'
                    : 'border-gray-200 text-gray-600 hover:border-carpi-red'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* El rango sale del catálogo real. Si estuviera fijo, cualquier
          producto por encima del tope quedaría invisible por defecto. */}
      {priceCeiling > priceFloor && (
        <FilterSection title="PRECIO">
          <div>
            <input
              type="range"
              min={priceFloor}
              max={priceCeiling}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-carpi-red"
            />
            <div className="flex justify-between text-xs text-gray-500 font-body mt-1">
              <span>${priceFloor.toLocaleString('es-AR')}</span>
              <span className="font-medium text-carpi-ink">
                &lt; ${maxPrice.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </FilterSection>
      )}
    </aside>
  )
}
