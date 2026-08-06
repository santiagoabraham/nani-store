'use client'

import Link from 'next/link'
import { ShoppingCart, Search, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCart } from '@/store/cartStore'
import { useTenant } from '@/context/TenantContext'
import { cn } from '@/lib/utils'
import type { ProductCategory } from '@/types'

interface HeaderProps {
  /** Categorías visibles del tenant — arman el menú. Las envía el layout de la vitrina. */
  categories: ProductCategory[]
}

export function Header({ categories }: HeaderProps) {
  const { tenant, settings } = useTenant()
  const { openCart, getItemCount } = useCart()
  const base = `/${tenant.slug}`

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const itemCount = getItemCount()

  useEffect(() => {
    setMounted(true)
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // El menú se arma con las categorías visibles de la base: al crear,
  // renombrar u ocultar una categoría desde el panel, esto se actualiza solo.
  const NAV_LINKS = [
    { href: base,               label: 'Inicio' },
    { href: `${base}/products`, label: 'Productos' },
    ...categories.map((c) => ({
      href: `${base}/products?category=${c.slug}`,
      label: c.name,
    })),
  ]

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* HEADER_H en tailwind.config.ts documenta por qué esta altura
              está acoplada al espaciador de abajo y al alto del hero. */}
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href={base} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {settings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logo_url} alt={settings.store_name} className="h-16 w-auto" />
              ) : (
                <>
                  <svg width="52" height="58" viewBox="0 0 32 36" fill="none" className="flex-shrink-0">
                    <path d="M16 1L2 6V18C2 25.7 8.3 32.8 16 35C23.7 32.8 30 25.7 30 18V6L16 1Z" fill="#00273E" stroke="#029CDC" strokeWidth="1.5" />
                    <path d="M16 6L5 10V18C5 23.8 9.8 29.2 16 31C22.2 29.2 27 23.8 27 18V10L16 6Z" fill="#00273E" />
                    <rect x="5" y="15" width="22" height="5" fill="white" opacity="0.9" />
                  </svg>
                  <div className="flex flex-col leading-none">
                    <span className="font-heading text-xs tracking-widest text-[#00273E]">CAMISETAS</span>
                    <span className="font-heading text-4xl tracking-widest leading-none" style={{ color: settings.primary_color }}>
                      {settings.store_name.toUpperCase()}
                    </span>
                  </div>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-gray-700 hover:text-[#029CDC] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#029CDC] group-hover:w-full transition-all duration-200" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-600 hover:text-[#029CDC] transition-colors" aria-label="Buscar">
                <Search size={20} />
              </button>
              <button
                onClick={openCart}
                className="relative p-2 text-gray-600 hover:text-[#029CDC] transition-colors"
                aria-label="Carrito"
              >
                <ShoppingCart size={20} />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-white font-heading text-xs flex items-center justify-center rounded-full" style={{ backgroundColor: settings.primary_color }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-2 text-gray-600 hover:text-[#029CDC] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menú"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-xl tracking-wider text-gray-900 hover:text-[#029CDC] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      {/*
        El header es fixed, así que sale del flujo: sin este espaciador el
        contenido de cada página arrancaría tapado. Su alto TIENE que coincidir
        con el del header (h-24 = 6rem) — el hero descuenta ese mismo valor para
        ocupar exactamente lo que queda de pantalla.
      */}
      <div className="h-24" />
    </>
  )
}
