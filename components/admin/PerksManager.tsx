'use client'

import { useState, useTransition } from 'react'
import { StorePerk } from '@/types'
import { ICON_NAMES, ICON_LABELS, iconFor } from '@/lib/icons'
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  initialPerks: StorePerk[]
  tenantSlug: string
}

type Location = StorePerk['location']

const LOCATION_LABELS: Record<Location, string> = {
  home: 'Portada',
  product: 'Ficha de producto',
}

const LOCATION_HINTS: Record<Location, string> = {
  home: 'Barra que aparece debajo del hero, en la página principal.',
  product: 'Recuadros que aparecen debajo del botón de agregar al carrito.',
}

const emptyDraft = (location: Location) => ({
  location, icon: 'CheckCircle', label: '', sublabel: '',
})

export function PerksManager({ initialPerks, tenantSlug }: Props) {
  const [perks, setPerks] = useState(initialPerks)
  const [draft, setDraft] = useState<ReturnType<typeof emptyDraft> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  const run = (fn: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try { await fn() } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar')
      }
    })
  }

  const handleSave = () => {
    if (!draft || !draft.label.trim()) return
    run(async () => {
      if (editId) {
        const { perk } = await send(`/${tenantSlug}/api/perks/${editId}`, 'PATCH', {
          icon: draft.icon, label: draft.label, sublabel: draft.sublabel,
        })
        setPerks((prev) => prev.map((p) => (p.id === editId ? perk : p)))
      } else {
        const siblings = perks.filter((p) => p.location === draft.location)
        const nextOrder = siblings.reduce((m, p) => Math.max(m, p.sort_order), -1) + 1
        const { perk } = await send(`/${tenantSlug}/api/perks`, 'POST', {
          ...draft, sort_order: nextOrder,
        })
        setPerks((prev) => [...prev, perk])
      }
      setDraft(null); setEditId(null)
    })
  }

  const toggleVisible = (perk: StorePerk) => run(async () => {
    await send(`/${tenantSlug}/api/perks/${perk.id}`, 'PATCH', { visible: !perk.visible })
    setPerks((prev) => prev.map((p) => (p.id === perk.id ? { ...p, visible: !p.visible } : p)))
  })

  const remove = (perk: StorePerk) => {
    if (!confirm(`¿Eliminar "${perk.label}"? Si solo querés sacarlo de la tienda, ocultalo.`)) return
    run(async () => {
      await send(`/${tenantSlug}/api/perks/${perk.id}`, 'DELETE')
      setPerks((prev) => prev.filter((p) => p.id !== perk.id))
    })
  }

  /** Reordena dentro de su ubicación y persiste solo lo que cambió de lugar. */
  const move = (perk: StorePerk, direction: -1 | 1) => {
    const group = perks.filter((p) => p.location === perk.location)
                       .sort((a, b) => a.sort_order - b.sort_order)
    const i = group.findIndex((p) => p.id === perk.id)
    const target = i + direction
    if (target < 0 || target >= group.length) return

    const reordered = [...group]
    const [moved] = reordered.splice(i, 1)
    reordered.splice(target, 0, moved)

    const renumbered = reordered.map((p, idx) => ({ ...p, sort_order: idx }))
    setPerks((prev) => [
      ...prev.filter((p) => p.location !== perk.location),
      ...renumbered,
    ])

    run(async () => {
      await Promise.all(
        renumbered
          .filter((p, idx) => group[idx]?.id !== p.id)
          .map((p) => send(`/${tenantSlug}/api/perks/${p.id}`, 'PATCH', { sort_order: p.sort_order }))
      )
    })
  }

  const startEdit = (perk: StorePerk) => {
    setDraft({ location: perk.location, icon: perk.icon, label: perk.label, sublabel: perk.sublabel })
    setEditId(perk.id)
    setError(null)
  }

  const inputCls = 'w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]'
  const labelCls = 'font-body text-xs text-gray-500 uppercase tracking-wider block mb-1'

  return (
    <div className="space-y-10">
      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      )}

      {(['home', 'product'] as Location[]).map((location) => {
        const group = perks.filter((p) => p.location === location)
                           .sort((a, b) => a.sort_order - b.sort_order)
        return (
          <section key={location}>
            <div className="flex items-end justify-between mb-1">
              <h2 className="font-heading text-xl tracking-wider text-gray-800">
                {LOCATION_LABELS[location].toUpperCase()}
              </h2>
              <button
                onClick={() => { setDraft(emptyDraft(location)); setEditId(null); setError(null) }}
                className="flex items-center gap-2 bg-[#029CDC] text-white font-heading tracking-wider text-xs px-4 py-2 hover:opacity-90"
              >
                <Plus size={14} /> AGREGAR
              </button>
            </div>
            <p className="font-body text-xs text-gray-400 mb-4">{LOCATION_HINTS[location]}</p>

            <div className="bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
              {group.length === 0 && (
                <p className="px-4 py-8 text-center font-body text-sm text-gray-400">
                  Sin bloques. La sección no se muestra en la tienda.
                </p>
              )}
              {group.map((perk, i) => {
                const Icon = iconFor(perk.icon)
                return (
                  <div key={perk.id} className={`flex items-center gap-4 px-4 py-3 ${perk.visible ? '' : 'bg-gray-50/60'}`}>
                    <div className="flex flex-col">
                      <button onClick={() => move(perk, -1)} disabled={i === 0 || isPending}
                        className="p-0.5 text-gray-400 hover:text-[#029CDC] disabled:opacity-25" aria-label="Subir">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => move(perk, 1)} disabled={i === group.length - 1 || isPending}
                        className="p-0.5 text-gray-400 hover:text-[#029CDC] disabled:opacity-25" aria-label="Bajar">
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <Icon size={20} className="text-[#029CDC] flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-base text-gray-900 leading-tight">{perk.label}</p>
                      <p className="font-body text-xs text-gray-400">{perk.sublabel || '—'}</p>
                    </div>

                    <button
                      onClick={() => toggleVisible(perk)} disabled={isPending}
                      className={`flex items-center gap-1.5 font-body text-xs px-2.5 py-1.5 border transition-colors ${perk.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}
                    >
                      {perk.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      {perk.visible ? 'Visible' : 'Oculto'}
                    </button>

                    <button onClick={() => startEdit(perk)} className="p-2 text-gray-400 hover:text-[#029CDC]" aria-label="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(perk)} className="p-2 text-gray-400 hover:text-red-500" aria-label="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Formulario de alta/edición */}
      {draft && (
        <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-lg tracking-wider text-gray-900">
            {editId ? 'EDITAR BLOQUE' : `NUEVO BLOQUE — ${LOCATION_LABELS[draft.location].toUpperCase()}`}
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Ícono</label>
              <select
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                className={inputCls}
              >
                {ICON_NAMES.map((n) => <option key={n} value={n}>{ICON_LABELS[n]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Texto principal</label>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                autoFocus
                placeholder="ENVÍO A TODO EL PAÍS"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Texto secundario</label>
              <input
                value={draft.sublabel}
                onChange={(e) => setDraft({ ...draft, sublabel: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                placeholder="Por Correo Argentino"
                className={inputCls}
              />
            </div>
          </div>

          {/* Vista previa: el mismo ícono y textos que va a ver el comprador */}
          <div className="border border-gray-100 bg-[#00273E] px-4 py-3 flex items-center gap-3">
            {(() => { const I = iconFor(draft.icon); return <I size={20} className="text-[#029CDC] flex-shrink-0" /> })()}
            <div>
              <p className="font-heading text-xs text-white tracking-wider">{draft.label || 'TEXTO PRINCIPAL'}</p>
              <p className="font-body text-xs text-white/50">{draft.sublabel || 'Texto secundario'}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setDraft(null); setEditId(null) }}
              className="px-4 py-2 border border-gray-200 font-body text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={isPending || !draft.label.trim()}
              className="px-4 py-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm hover:opacity-90 disabled:opacity-60">
              {isPending ? '...' : editId ? 'GUARDAR' : 'CREAR'}
            </button>
          </div>
        </div>
      )}

      <p className="font-body text-xs text-gray-400">
        Ocultar un bloque lo saca de la tienda pero conserva el texto. Si una sección se queda
        sin bloques visibles, directamente no se dibuja: el diseño se reacomoda solo, sin huecos.
      </p>
    </div>
  )
}
