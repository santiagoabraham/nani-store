'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ContentState {
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  heroSecondary: string
  carouselImages: string[]
  newsletterTitle: string
  newsletterSubtitle: string
  footerTagline: string
  footerInstagram: string
  footerEmail: string
  setContent: (updates: Partial<Omit<ContentState, 'setContent' | 'resetContent'>>) => void
  resetContent: () => void
}

const defaults = {
  heroTitle: 'TU CAMISETA, TU PASIÓN',
  heroSubtitle: 'Camisetas de fútbol originales y de alta calidad. Racing Club, Selecciones y los mejores clubes del mundo.',
  heroCta: 'VER COLECCIÓN',
  heroSecondary: 'RACING CLUB',
  carouselImages: [
    'https://placehold.co/1600x900/00273E/029CDC?text=CAMISETAS+CARPI',
    'https://placehold.co/1600x900/029CDC/FFFFFF?text=RACING+CLUB',
    'https://placehold.co/1600x900/00273E/FFFFFF?text=NUEVA+COLECCION',
  ],
  newsletterTitle: '¡SUMATE A LA FAMILIA CARPI!',
  newsletterSubtitle: 'Enterate primero de los nuevos lanzamientos y promociones exclusivas.',
  footerTagline: 'Tu camiseta, tu pasión. Camisetas de fútbol originales y de alta calidad. Racing Club, Selecciones y los mejores clubes del mundo.',
  footerInstagram: '@camisetas.carpi.rc',
  footerEmail: 'hola@camisetascarpi.com.ar',
}

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      ...defaults,
      setContent: (updates) => set(updates),
      resetContent: () => set(defaults),
    }),
    { name: 'carpi-content' }
  )
)
