'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Product, ProductCategory, ProductInsert, Size, JerseyVersion, SIZE_PRESETS,
} from '@/types'
import { CLUB_GROUPS, CLUB_OTHER, isKnownClub, leagueForClub } from '@/lib/clubs'
import { GARMENT_TYPES } from '@/lib/garments'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { X, Upload, Plus } from 'lucide-react'

interface Props {
  tenantSlug: string
  tenantId: string
  categories: ProductCategory[]
  product?: Product
}

const VERSIONS: JerseyVersion[] = ['Home', 'Away', 'Third']
const VERSION_LABELS: Record<JerseyVersion, string> = {
  Home: 'Titular', Away: 'Alternativa', Third: 'Tercera',
}

export function TenantProductForm({ tenantSlug, categories, product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Un club que no está en el catálogo (o un producto viejo cargado a mano)
  // arranca el formulario en modo "Otro" con el campo de texto abierto.
  const startsCustom = Boolean(product?.team) && !isKnownClub(product!.team)

  const [form, setForm] = useState({
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    team: product?.team ?? '',
    league: product?.league ?? '',
    category_id: product?.categoryId ?? categories[0]?.id ?? '',
    garment_type: product?.garmentType || GARMENT_TYPES[0],
    price: product?.price ? String(product.price) : '',
    original_price: product?.originalPrice ? String(product.originalPrice) : '',
    description: product?.description ?? '',
    badge: product?.badge ?? '',
    in_stock: product?.inStock ?? true,
  })
  const [customClub, setCustomClub] = useState(startsCustom)
  const [sizes, setSizes] = useState<Size[]>(product?.sizes ?? [...SIZE_PRESETS])
  const [newSize, setNewSize] = useState('')
  const [versions, setVersions] = useState<JerseyVersion[]>(product?.availableVersions ?? ['Home'])
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60)

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: product ? f.slug : autoSlug(name) }))
  }

  // Elegir un club del catálogo completa la liga sola.
  const handleClubChange = (value: string) => {
    if (value === CLUB_OTHER) {
      setCustomClub(true)
      setForm((f) => ({ ...f, team: '', league: '' }))
      return
    }
    setCustomClub(false)
    setForm((f) => ({ ...f, team: value, league: leagueForClub(value) }))
  }

  const toggleSize = (s: Size) =>
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const addCustomSize = () => {
    const value = newSize.trim().toUpperCase()
    if (!value) return
    if (!sizes.includes(value)) setSizes((prev) => [...prev, value])
    setNewSize('')
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const payload = await res.json().catch(() => ({}))

      // Sin este chequeo un fallo del servidor (bucket inexistente, archivo
      // muy pesado, sesión vencida) se traga el error y no pasa nada visible.
      if (!res.ok || !payload.url) {
        setUploadError(payload.error ?? `No se pudo subir la imagen (error ${res.status}).`)
        return
      }
      setImages((prev) => [...prev, payload.url])
    } catch {
      setUploadError('No se pudo conectar con el servidor para subir la imagen.')
    } finally {
      setUploading(false)
      e.target.value = '' // permite reintentar con el mismo archivo
    }
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (!form.slug.trim()) e.slug = 'Requerido'
    if (!form.team.trim()) e.team = 'Elegí un club o cargalo a mano'
    if (!form.price || isNaN(Number(form.price))) e.price = 'Precio inválido'
    if (sizes.length === 0) e.sizes = 'Seleccioná al menos un talle'
    if (versions.length === 0) e.versions = 'Seleccioná al menos una versión'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    startTransition(async () => {
      const data: ProductInsert = {
        slug: form.slug.trim(),
        name: form.name.trim(),
        team: form.team.trim(),
        league: form.league.trim(),
        category_id: form.category_id || null,
        garment_type: form.garment_type || null,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        sizes,
        available_versions: versions,
        images,
        description: form.description.trim(),
        features: product?.features ?? [],
        badge: form.badge || null,
        in_stock: form.in_stock,
      }

      if (product) {
        await fetch(`/${tenantSlug}/api/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        await fetch(`/${tenantSlug}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }

      router.push(`/${tenantSlug}/admin/products`)
      router.refresh()
    })
  }

  const labelCls = 'font-body text-xs text-gray-500 uppercase tracking-wider block mb-1'
  const fieldCls = 'w-full border px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]'

  const inp = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={`${fieldCls} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6 bg-white border border-gray-100 p-8 shadow-sm">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Nombre</label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`${fieldCls} ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {inp('slug', 'Slug (URL)')}

        {/* Club — desplegable agrupado por liga, con salida a texto libre */}
        <div>
          <label className={labelCls}>Club</label>
          <select
            value={customClub ? CLUB_OTHER : form.team}
            onChange={(e) => handleClubChange(e.target.value)}
            className={`${fieldCls} ${errors.team ? 'border-red-400' : 'border-gray-200'}`}
          >
            <option value="">Elegí un club…</option>
            {CLUB_GROUPS.map((group) => (
              <optgroup key={group.league} label={`${group.region} — ${group.league}`}>
                {group.clubs.map((club) => (
                  <option key={club} value={club}>{club}</option>
                ))}
              </optgroup>
            ))}
            <option value={CLUB_OTHER}>Otro (cargar a mano)…</option>
          </select>
          {customClub && (
            <input
              value={form.team}
              onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
              placeholder="Nombre del club"
              autoFocus
              className={`${fieldCls} mt-2 ${errors.team ? 'border-red-400' : 'border-gray-200'}`}
            />
          )}
          {errors.team && <p className="text-xs text-red-500 mt-1">{errors.team}</p>}
        </div>

        {inp('league', 'Liga')}

        <div>
          <label className={labelCls}>Categoría</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            className={`${fieldCls} border-gray-200`}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.visible ? '' : ' (oculta)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Prenda</label>
          <select
            value={form.garment_type}
            onChange={(e) => setForm((f) => ({ ...f, garment_type: e.target.value }))}
            className={`${fieldCls} border-gray-200`}
          >
            {GARMENT_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {inp('price', 'Precio original', 'number')}
        {inp('original_price', 'Precio en oferta (opcional)', 'number')}

        <div>
          <label className={labelCls}>Badge</label>
          <select
            value={form.badge}
            onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
            className={`${fieldCls} border-gray-200`}
          >
            <option value="">Sin badge</option>
            <option value="New">New</option>
            <option value="Sale">Sale</option>
            <option value="Limited">Limited</option>
          </select>
        </div>
      </div>

      {/* Talles — presets + carga manual para talles numéricos viejos */}
      <div>
        <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-2">Talles</label>
        <div className="flex gap-2 flex-wrap">
          {Array.from(new Set([...SIZE_PRESETS, ...sizes])).map((s) => (
            <button
              key={s} type="button" onClick={() => toggleSize(s)}
              className={`min-w-[3rem] px-3 h-10 font-heading text-sm border transition-colors ${sizes.includes(s) ? 'bg-[#00273E] text-white border-[#00273E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >{s}</button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize() } }}
            placeholder="Otro talle (34, 36, 38…)"
            className="border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC] w-52"
          />
          <button
            type="button" onClick={addCustomSize}
            className="flex items-center gap-1 px-3 h-10 border border-gray-200 font-body text-sm text-gray-600 hover:border-[#029CDC] hover:text-[#029CDC] transition-colors"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
        <p className="font-body text-xs text-gray-400 mt-2">
          Los talles que agregues quedan seleccionados. Tocá uno para activarlo o desactivarlo.
        </p>
        {errors.sizes && <p className="text-xs text-red-500 mt-1">{errors.sizes}</p>}
      </div>

      {/* Versions */}
      <div>
        <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-2">Versiones</label>
        <div className="flex gap-2">
          {VERSIONS.map((v) => (
            <button
              key={v} type="button" onClick={() => setVersions((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
              className={`px-4 h-10 font-heading text-sm border transition-colors ${versions.includes(v) ? 'bg-[#00273E] text-white border-[#00273E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >{VERSION_LABELS[v]}</button>
          ))}
        </div>
        {errors.versions && <p className="text-xs text-red-500 mt-1">{errors.versions}</p>}
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className={`${fieldCls} border-gray-200 resize-none`}
        />
      </div>

      {/* Images */}
      <div>
        <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-2">Imágenes</label>
        <div className="flex gap-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-24 bg-gray-50">
              <Image src={img} alt={`Imagen ${i + 1}`} fill className="object-cover" sizes="80px" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full">
                <X size={10} />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <label className={`w-20 h-24 border-2 border-dashed flex flex-col items-center justify-center transition-colors ${uploading ? 'border-gray-200 cursor-wait opacity-60' : 'border-gray-200 hover:border-[#029CDC] cursor-pointer'}`}>
              <Upload size={18} className="text-gray-400" />
              <span className="font-body text-xs text-gray-400 mt-1">
                {uploading ? 'Subiendo…' : 'Subir'}
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>
        {uploadError && (
          <p className="font-body text-xs text-red-500 mt-2">{uploadError}</p>
        )}
      </div>

      {/* In stock toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, in_stock: !f.in_stock }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.in_stock ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${form.in_stock ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
          <span className="font-body text-sm text-gray-700">En stock</span>
        </label>
        {!form.in_stock && (
          <p className="font-body text-xs text-gray-400 mt-1.5">
            Sin stock el producto no aparece en la tienda y su link directo da 404.
          </p>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Button variant="primary" size="lg" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'GUARDANDO...' : product ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
        </Button>
        <Button variant="outline" size="lg" onClick={() => router.push(`/${tenantSlug}/admin/products`)}>
          CANCELAR
        </Button>
      </div>
    </div>
  )
}
