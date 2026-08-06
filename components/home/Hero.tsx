'use client'

import { StoreSettings } from '@/types'
import { useTenant } from '@/context/TenantContext'
import { HeroCarousel } from '@/components/ui/HeroCarousel'

interface Props { settings: StoreSettings }

export function Hero({ settings }: Props) {
  const { tenant } = useTenant()
  return (
    <HeroCarousel
      images={settings.carousel_images}
      title={settings.hero_title}
      subtitle={settings.hero_subtitle}
      cta={settings.hero_cta}
      ctaHref={`/${tenant.slug}/products`}
    />
  )
}
