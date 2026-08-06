'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Product } from '@/types'
import { formatPriceARS } from '@/lib/utils'

interface Props {
  products: Product[]
  tenantSlug: string
}

const BADGE_COLOR: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-700',
  Sale: 'bg-red-100 text-red-700',
  Limited: 'bg-purple-100 text-purple-700',
}

export function ProductsTable({ products: initial, tenantSlug }: Props) {
  const [products, setProducts] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const base = `/${tenantSlug}/admin`

  const toggleStock = (id: string, current: boolean) => {
    startTransition(async () => {
      await fetch(`/${tenantSlug}/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !current }),
      })
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, inStock: !current } : p))
      )
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Seguro que querés eliminar este producto?')) return
    startTransition(async () => {
      await fetch(`/${tenantSlug}/api/products/${id}`, { method: 'DELETE' })
      setProducts((prev) => prev.filter((p) => p.id !== id))
    })
  }

  return (
    <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['Producto', 'Categoría', 'Precio', 'Stock', 'Badge', 'Acciones'].map((h) => (
              <th key={h} className="px-5 py-3 text-left font-heading text-xs tracking-wider text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-gray-400">Sin productos</td></tr>
          )}
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  {p.images[0] && (
                    <div className="relative w-10 h-12 bg-gray-50 flex-shrink-0">
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div>
                    <p className="font-body text-sm text-gray-900 font-medium">{p.name}</p>
                    <p className="font-body text-xs text-gray-400">{p.team}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 font-body text-sm text-gray-500 capitalize">{p.category}</td>
              <td className="px-5 py-4">
                <p className="font-heading text-sm text-gray-900">{formatPriceARS(p.price)}</p>
                {p.originalPrice && (
                  <p className="font-body text-xs text-gray-400 line-through">{formatPriceARS(p.originalPrice)}</p>
                )}
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={() => toggleStock(p.id, p.inStock)}
                  disabled={isPending}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.inStock ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.inStock ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                </button>
              </td>
              <td className="px-5 py-4">
                {p.badge && (
                  <span className={`px-2 py-0.5 rounded text-xs font-body ${BADGE_COLOR[p.badge]}`}>{p.badge}</span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Link href={`${base}/products/${p.id}/edit`} className="text-gray-400 hover:text-[#029CDC] transition-colors" aria-label="Editar">
                    <Pencil size={15} />
                  </Link>
                  <button onClick={() => handleDelete(p.id)} disabled={isPending} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
