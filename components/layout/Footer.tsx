'use client'

import Link from 'next/link'
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin } from 'lucide-react'
import { useTenant } from '@/context/TenantContext'

export function Footer() {
  const { tenant, settings } = useTenant()
  const base = `/${tenant.slug}`

  const links = {
    tienda: [
      { href: `${base}/products`, label: 'Todas las camisetas' },
      { href: `${base}/products?category=racing`, label: 'Racing Club' },
      { href: `${base}/products?category=selecciones`, label: 'Selecciones' },
      { href: `${base}/products?category=europa`, label: 'Europa' },
    ],
    ayuda: [
      { href: '#', label: 'Guía de talles' },
      { href: '#', label: 'Envíos y devoluciones' },
      { href: '#', label: 'Preguntas frecuentes' },
      { href: '#', label: 'Contacto' },
    ],
    empresa: [
      { href: '#', label: `Sobre ${settings.store_name}` },
      { href: '#', label: 'Autenticidad garantizada' },
      { href: '#', label: 'Política de privacidad' },
      { href: '#', label: 'Términos y condiciones' },
    ],
  }

  return (
    <footer className="bg-carpi-ink text-white">
      <div className="bg-carpi-navy py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-heading text-lg tracking-wider">10% OFF PAGANDO EN EFECTIVO O POR TRANSFERENCIA</p>
          <Link href={`${base}/products`} className="font-body text-sm underline hover:no-underline">
            Ver colección →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <svg width="36" height="40" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 1L2 6V18C2 25.7 8.3 32.8 16 35C23.7 32.8 30 25.7 30 18V6L16 1Z"
                  fill="#00273E"
                  stroke="#029CDC"
                  strokeWidth="1.5"
                />
                <path d="M16 6L5 10V18C5 23.8 9.8 29.2 16 31C22.2 29.2 27 23.8 27 18V10L16 6Z" fill="#00273E" />
                <rect x="5" y="15" width="22" height="5" fill="white" opacity="0.9" />
              </svg>
              <div className="flex flex-col leading-none">
                <span className="font-heading text-[10px] tracking-widest text-carpi-navy">CAMISETAS</span>
                <span className="font-heading text-3xl text-carpi-red tracking-widest leading-none">
                  {settings.store_name.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="font-body text-gray-400 text-sm max-w-xs leading-relaxed">
              {settings.footer_tagline}
            </p>
            <div className="flex gap-4 mt-6">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href={i === 0 && settings.footer_instagram ? `https://instagram.com/${settings.footer_instagram.replace('@', '')}` : '#'}
                  target={i === 0 ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-gray-700 flex items-center justify-center text-gray-400 hover:border-carpi-red hover:text-carpi-red transition-colors duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {[
                { icon: Instagram, text: settings.footer_instagram },
                { icon: Mail, text: settings.footer_email },
                { icon: MapPin, text: 'Buenos Aires, Argentina' },
              ].filter(({ text }) => !!text).map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-gray-400 text-sm font-body">
                  <Icon size={14} className="text-carpi-red flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="font-heading text-lg tracking-widest text-white mb-4 uppercase">{section}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="font-body text-sm text-gray-400 hover:text-carpi-red transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-gray-500">
            © {new Date().getFullYear()} {settings.store_name}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-body text-xs text-gray-500">Métodos de pago:</span>
            {['Visa', 'MC', 'Amex', 'MP'].map((p) => (
              <span
                key={p}
                className="font-heading text-xs bg-gray-800 text-gray-400 px-2 py-1 tracking-wider"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
