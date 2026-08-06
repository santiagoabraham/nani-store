import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Camisetas Carpi',
  description: 'Multi-tenant football jersey e-commerce platform.',
}

/**
 * Minimal root layout — just fonts and globals.
 * Each tenant has its own layout under app/[tenant]/layout.tsx
 * which renders the Header, Footer, and CartDrawer with tenant config.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  )
}
