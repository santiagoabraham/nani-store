import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md'
  className?: string
}

export function StarRating({ rating, reviewCount, size = 'sm', className }: StarRatingProps) {
  const starSize = size === 'sm' ? 12 : 16

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={starSize}
          className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-200'}
        />
      ))}
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500 ml-1 font-body">({reviewCount})</span>
      )}
    </div>
  )
}
