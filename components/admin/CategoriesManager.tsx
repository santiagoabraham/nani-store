'use client'

import { useState, useTransition } from 'react'
import { ProductCategory } from '@/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  initialCategories: ProductCategory[]
  tenantSlug: string
}

export function CategoriesManager({ initialCategories, tenantSlug }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const resetForm = () => { setName(''); setEditId(null); setShowForm(false); setError(null) }

  /** Centraliza el fetch para que ningún error del servidor pase desapercibido. */
  const send = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error ?? `Error ${res.status}`)
    return payload
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      try {
        if (editId) {
          const { category } = await send(`/${tenantSlug}/api/categories/${editId}`, 'PATCH', { name: trimmed })
          setCategories((prev) => prev.map((c) => (c.id === editId ? { ...c, name: category.name } : c)))
        } else {
          const nextOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0) + 1
          const { category } = await send(`/${tenantSlug}/api/categories`, 'POST', {
            name: trimmed, sort_order: nextOrder,
          })
          setCategories((prev) => [...prev, {
            id: category.id, slug: category.slug, name: category.name,
            description: category.description ?? '', image: category.image ?? '',
            count: 0, comingSoon: category.coming_soon,
            visible: category.visible, sortOrder: category.sort_order,
          }])
        }
        resetForm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar')
      }
    })
  }

  const handleToggleVisible = (cat: ProductCategory) => {
    setError(null)
    startTransition(async () => {
      try {
        await send(`/${tenantSlug}/api/categories/${cat.id}`, 'PATCH', { visible: !cat.visible })
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, visible: !c.visible } : c)))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo cambiar la visibilidad')
      }
    })
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const reordered = [...categories]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)

    // Renumera de 0 en adelante y persiste sólo lo que cambió de posición.
    const withOrder = reordered.map((c, i) => ({ ...c, sortOrder: i }))
    setCategories(withOrder)
    setError(null)
    startTransition(async () => {
      try {
        await Promise.all(
          withOrder
            .filter((c, i) => categories[i]?.id !== c.id)
            .map((c) => send(`/${tenantSlug}/api/categories/${c.id}`, 'PATCH', { sort_order: c.sortOrder }))
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo reordenar')
      }
    })
  }

  const handleDelete = (cat: ProductCategory) => {
    if (cat.count > 0) {
      setError(
        `"${cat.name}" tiene ${cat.count} producto(s). Ocultala en vez de borrarla, ` +
        `o movelos antes a otra categoría.`
      )
      return
    }
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Está vacía, no se pierde ningún producto.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await send(`/${tenantSlug}/api/categories/${cat.id}`, 'DELETE')
        setCategories((prev) => prev.filter((c) => c.id !== cat.id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo eliminar')
      }
    })
  }

  const startEdit = (cat: ProductCategory) => {
    setName(cat.name)
    setEditId(cat.id)
    setShowForm(true)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-heading text-lg tracking-wider text-gray-900 mb-4">
            {editId ? 'RENOMBRAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[16rem]">
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                autoFocus
                placeholder="Equipos, Selecciones, Retro…"
                className="w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-200 font-body text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending} className="px-4 py-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm hover:opacity-90 disabled:opacity-60">
                {isPending ? '...' : editId ? 'GUARDAR' : 'CREAR'}
              </button>
            </div>
          </div>
          {editId && (
            <p className="font-body text-xs text-gray-400 mt-3">
              El nombre cambia en la tienda, pero el slug de la URL queda igual para no romper links ya compartidos.
            </p>
          )}
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm px-6 py-3 hover:opacity-90">
          <Plus size={16} /> NUEVA CATEGORÍA
        </button>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Orden', 'Nombre', 'Slug', 'Productos', 'En la tienda', 'Acciones'].map((h) => (
                <th key={h} className="text-left font-body text-xs text-gray-500 uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-body text-sm text-gray-400">
                  Todavía no hay categorías.
                </td>
              </tr>
            ) : categories.map((cat, i) => (
              <tr key={cat.id} className={cat.visible ? '' : 'bg-gray-50/60'}>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMove(i, -1)} disabled={i === 0 || isPending}
                      className="p-1 text-gray-400 hover:text-[#029CDC] disabled:opacity-25 disabled:hover:text-gray-400"
                      aria-label="Subir"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMove(i, 1)} disabled={i === categories.length - 1 || isPending}
                      className="p-1 text-gray-400 hover:text-[#029CDC] disabled:opacity-25 disabled:hover:text-gray-400"
                      aria-label="Bajar"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-heading text-base text-gray-900">
                  {cat.name}
                  {!cat.visible && (
                    <span className="ml-2 font-body text-xs text-gray-400 uppercase tracking-wider">oculta</span>
                  )}
                </td>
                <td className="px-4 py-3 font-body text-sm text-gray-400">{cat.slug}</td>
                <td className="px-4 py-3 font-body text-sm text-gray-600">{cat.count}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleVisible(cat)} disabled={isPending}
                    className={`flex items-center gap-1.5 font-body text-xs px-2.5 py-1.5 border transition-colors ${cat.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {cat.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {cat.visible ? 'Visible' : 'Oculta'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-2 text-gray-400 hover:text-[#029CDC] transition-colors"
                      aria-label={`Renombrar ${cat.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                      disabled={cat.count > 0}
                      aria-label={`Eliminar ${cat.name}`}
                      title={cat.count > 0 ? 'Tiene productos: ocultala en vez de borrarla' : 'Eliminar'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="font-body text-xs text-gray-400">
        Ocultar una categoría la saca del menú y de los filtros de la tienda, pero no borra nada:
        los productos siguen cargados y vuelven a aparecer cuando la volvés a mostrar.
      </p>
    </div>
  )
}
