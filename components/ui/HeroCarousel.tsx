'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroCarouselProps {
  images: string[]
  title: string
  subtitle: string
  cta: string
  ctaHref: string
}

export function HeroCarousel({ images, title, subtitle, cta, ctaHref }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStart = useRef<number | null>(null)
  const total = images.length

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % total),
    [total]
  )
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + total) % total),
    [total]
  )

  useEffect(() => {
    if (isPaused || total <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next, isPaused, total])

  const titleParts = title.includes(',')
    ? [title.split(',')[0].trim() + ',', title.split(',').slice(1).join(',').trim()]
    : [title]

  return (
    <section
      /*
        Alto = pantalla MENOS el header (h-24 = 6rem). El header es fixed y deja
        un espaciador del mismo alto, así que un h-screen pelado empujaba 6rem
        del hero abajo del pliegue: se veía cortado y la página scrolleaba de más.

        svh en vez de vh: en el navegador del celular vh cuenta la barra de
        direcciones aunque esté visible, y el hero terminaba más alto que la
        pantalla real.
      */
      className="relative w-full h-[calc(100svh-6rem)] min-h-[520px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return
        const diff = touchStart.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
        touchStart.current = null
      }}
    >
      {/* Slides */}
      {images.map((src, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={i !== current}
        >
          <Image
            src={src}
            alt={`Slide ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
            unoptimized
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-carpi-navy/70 via-carpi-navy/40 to-carpi-navy/75" />

      {/* Content */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6">
        <p className="font-heading text-carpi-red text-sm sm:text-base tracking-[0.4em] mb-6 uppercase">
          Nueva Colección 2024/25
        </p>
        <h1 className="font-heading text-white leading-none tracking-wider mb-6">
          <span className="block text-5xl sm:text-7xl lg:text-[9rem]">{titleParts[0]}</span>
          {titleParts[1] && (
            <span className="block text-5xl sm:text-7xl lg:text-[9rem] text-carpi-red">
              {titleParts[1]}
            </span>
          )}
        </h1>
        <p className="font-body text-white/70 text-base sm:text-lg max-w-md mb-10">
          {subtitle}
        </p>
        <Link
          href={ctaHref}
          className="font-heading tracking-[0.25em] text-white bg-carpi-red px-10 py-4 text-sm sm:text-base hover:opacity-90 transition-opacity"
        >
          {cta}
        </Link>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
          <button
            onClick={next}
            aria-label="Slide siguiente"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ChevronRight className="text-white" size={24} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-carpi-red'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
