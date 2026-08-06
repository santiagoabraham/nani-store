import { cn } from '@/lib/utils'
import { BadgeType } from '@/types'

interface BadgeProps {
  type: BadgeType
  className?: string
}

const badgeStyles: Record<BadgeType, string> = {
  New: 'bg-emerald-500 text-white',
  Sale: 'bg-carpi-red text-white',
  Limited: 'bg-amber-500 text-white',
}

export function Badge({ type, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-heading tracking-widest text-xs px-2 py-1 uppercase',
        badgeStyles[type],
        className
      )}
    >
      {type === 'New' ? 'Nuevo' : type === 'Sale' ? 'Oferta' : 'Limitado'}
    </span>
  )
}
