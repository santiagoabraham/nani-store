'use client'

import { Size } from '@/types'
import { cn } from '@/lib/utils'

interface SizeSelectorProps {
  sizes: Size[]
  selected: Size | null
  onSelect: (size: Size) => void
}

export function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={cn(
            'w-14 h-14 font-heading text-lg tracking-wider border-2 transition-all duration-150',
            selected === size
              ? 'border-carpi-red bg-carpi-red text-white'
              : 'border-gray-200 text-gray-700 hover:border-carpi-red hover:text-carpi-red'
          )}
        >
          {size}
        </button>
      ))}
    </div>
  )
}
