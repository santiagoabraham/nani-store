'use client'

import { useState, useTransition } from 'react'
import { DBCoupon, CouponInsert, DiscountType } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Props {
  initialCoupons: DBCoupon[]
  tenantSlug: string
}

type CouponForm = { code: string; type: DiscountType; value: string; active: boolean; max_uses: string }
const emptyForm = (): CouponForm => ({ code: '', type: 'percent', value: '', active: true, max_uses: '' })

export function CouponsManager({ initialCoupons, tenantSlug }: Props) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [form, setForm] = useState<CouponForm>(emptyForm())
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const resetForm = () => { setForm(emptyForm()); setEditId(null); setShowForm(false) }

  const handleSave = () => {
    if (!form.code.trim() || !form.value) return
    startTransition(async () => {
      const data: CouponInsert = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        active: form.active,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
      }
      if (editId) {
        const res = await fetch(`/${tenantSlug}/api/coupons/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const { coupon } = await res.json()
        setCoupons((prev) => prev.map((c) => (c.id === editId ? coupon : c)))
      } else {
        const res = await fetch(`/${tenantSlug}/api/coupons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const { coupon } = await res.json()
        setCoupons((prev) => [coupon, ...prev])
      }
      resetForm()
    })
  }

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await fetch(`/${tenantSlug}/api/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current }),
      })
      const { coupon } = await res.json()
      setCoupons((prev) => prev.map((c) => (c.id === id ? coupon : c)))
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return
    startTransition(async () => {
      await fetch(`/${tenantSlug}/api/coupons/${id}`, { method: 'DELETE' })
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    })
  }

  const startEdit = (c: DBCoupon) => {
    setForm({ code: c.code, type: c.type, value: String(c.value), active: c.active, max_uses: c.max_uses ? String(c.max_uses) : '' })
    setEditId(c.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-heading text-lg tracking-wider text-gray-900 mb-4">
            {editId ? 'EDITAR CUPÓN' : 'NUEVO CUPÓN'}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Código</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC] uppercase" placeholder="CARPI10" />
            </div>
            <div>
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]">
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Valor</label>
              <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]" placeholder="10" />
            </div>
            <div>
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Usos máx. (opcional)</label>
              <input type="number" value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                className="w-full border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]" placeholder="∞" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="sr-only" />
              <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
              </div>
              <span className="font-body text-sm text-gray-600">Activo</span>
            </label>
            <div className="flex gap-2 ml-auto">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-200 font-body text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={isPending} className="px-4 py-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm hover:opacity-90 disabled:opacity-60">
                {isPending ? '...' : editId ? 'GUARDAR' : 'CREAR'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm px-6 py-3 hover:opacity-90">
          <Plus size={16} /> NUEVO CUPÓN
        </button>
      )}

      <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Código', 'Descuento', 'Usos', 'Máx.', 'Activo', 'Acciones'].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-heading text-xs tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center font-body text-sm text-gray-400">Sin cupones</td></tr>
            )}
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-heading text-sm tracking-wider text-gray-900">{c.code}</td>
                <td className="px-5 py-4 font-body text-sm text-gray-700">
                  {c.value}{c.type === 'percent' ? '%' : ' ARS'}
                </td>
                <td className="px-5 py-4 font-body text-sm text-gray-500">{c.uses}</td>
                <td className="px-5 py-4 font-body text-sm text-gray-500">{c.max_uses ?? '∞'}</td>
                <td className="px-5 py-4">
                  <button onClick={() => handleToggle(c.id, c.active)} disabled={isPending}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${c.active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-[#029CDC]"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
