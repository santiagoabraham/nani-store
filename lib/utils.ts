import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceARS(price: number): string {
  return '$' + Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * 'Ligas Locales' → 'ligas-locales', 'Bélgica' → 'belgica'.
 * Se usa para el slug de categorías; el de productos tiene su propia
 * versión en el formulario porque no normaliza tildes.
 */
export function slugify(value: string): string {
  return value
    // NFD parte 'é' en 'e' + acento suelto; el filtro de abajo se come
    // el acento y sobrevive la letra base. Sin esto, 'Bélgica' → 'blgica'.
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}
