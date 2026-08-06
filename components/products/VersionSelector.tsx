'use client'

import { JerseyVersion } from '@/types'
import { cn } from '@/lib/utils'

const versionLabels: Record<JerseyVersion, string> = {
  Home: 'Titular',
  Away: 'Visitante',
  Third: 'Tercera',
}

interface VersionSelectorProps {
  versions: JerseyVersion[]
  selected: JerseyVersion
  onSelect: (version: JerseyVersion) => void
}

export function VersionSelector({ versions, selected, onSelect }: VersionSelectorProps) {
  return (
    <div className="flex gap-2">
      {versions.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={cn(
            'px-5 py-2 font-heading tracking-wider text-base border-2 transition-all duration-150',
            selected === v
              ? 'border-carpi-red bg-carpi-red text-white'
              : 'border-gray-200 text-gray-600 hover:border-carpi-red hover:text-carpi-red'
          )}
        >
          {versionLabels[v]}
        </button>
      ))}
    </div>
  )
}
