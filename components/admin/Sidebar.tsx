'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAdmin } from '@/lib/auth/adminAuth'
import {
  LayoutDashboard, Shirt, ShoppingBag, Tag, Layers, Package,
  Settings, BarChart2, LogOut, FolderOpen, LayoutTemplate,
} from 'lucide-react'

interface Props {
  tenantSlug: string
  adminEmail: string
}

export function Sidebar({ tenantSlug, adminEmail }: Props) {
  const pathname = usePathname()
  const base = `/${tenantSlug}/admin`

  const navItems = [
    { href: base,                   label: 'Dashboard',  icon: LayoutDashboard, exact: true },
    { href: `${base}/products`,     label: 'Productos',  icon: Shirt },
    { href: `${base}/categories`,   label: 'Categorías', icon: Layers },
    { href: `${base}/orders`,       label: 'Pedidos',    icon: ShoppingBag },
    { href: `${base}/dispatch`,     label: 'Por despachar', icon: Package },
    { href: `${base}/coupons`,      label: 'Cupones',    icon: Tag },
    { href: `${base}/content`,      label: 'Contenido',  icon: LayoutTemplate },
    { href: `${base}/settings`,     label: 'Configuración', icon: Settings },
    { href: `${base}/analytics`,    label: 'Analytics',  icon: BarChart2 },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const boundLogout = logoutAdmin.bind(null, tenantSlug)

  return (
    <aside className="w-64 min-h-screen bg-[#00273E] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="28" height="32" viewBox="0 0 32 36" fill="none">
            <path d="M16 1L2 6V18C2 25.7 8.3 32.8 16 35C23.7 32.8 30 25.7 30 18V6L16 1Z" fill="#00273E" stroke="#029CDC" strokeWidth="2" />
            <path d="M16 6L5 10V18C5 23.8 9.8 29.2 16 31C22.2 29.2 27 23.8 27 18V10L16 6Z" fill="#001a4f" />
            <rect x="5" y="15" width="22" height="5" fill="white" opacity="0.9" />
          </svg>
          <div className="leading-none">
            <p className="text-[9px] font-heading tracking-widest text-white/60">PANEL ADMIN</p>
            <p className="text-xl font-heading tracking-widest text-[#029CDC] leading-none">
              {tenantSlug.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded font-body text-sm transition-all duration-150 ${
                active ? 'bg-[#029CDC] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Store link */}
      <div className="px-3 pb-2">
        <Link
          href={`/${tenantSlug}`}
          className="flex items-center gap-3 px-4 py-2 font-body text-xs text-white/40 hover:text-white/70 transition-colors"
          target="_blank"
        >
          <FolderOpen size={14} />
          Ver tienda →
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action={boundLogout}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-4 py-3 rounded font-body text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </form>
        <p className="mt-3 px-4 text-xs font-body text-white/30 truncate">{adminEmail}</p>
      </div>
    </aside>
  )
}
