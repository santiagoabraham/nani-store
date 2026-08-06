'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Upload, ArrowLeft, ArrowRight, ImageOff } from 'lucide-react'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

/**
 * Gestor de las imágenes del carrusel del hero.
 *
 * carousel_images existía en la base desde el principio pero no tenía
 * ninguna interfaz: para cambiar la portada había que editar la fila a mano.
 */
export function CarouselImagesField({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.url) {
        setError(payload.error ?? `No se pudo subir la imagen (error ${res.status}).`)
        return
      }
      onChange([...images, payload.url])
    } catch {
      setError('No se pudo conectar con el servidor para subir la imagen.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  return (
    <div>
      <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">
        Imágenes del hero
      </label>
      <p className="font-body text-xs text-gray-400 mb-3">
        Se muestran en orden y rotan solas cada 5 segundos. Con una sola imagen, el
        carrusel se convierte en una portada fija y se ocultan flechas y puntos.
      </p>

      {images.length === 0 && (
        <div className="border border-dashed border-gray-200 px-4 py-6 mb-3 flex items-center gap-3 text-gray-400">
          <ImageOff size={20} />
          <p className="font-body text-sm">
            Sin imágenes: el hero se ve con el fondo degradado y el texto encima.
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {images.map((img, i) => (
          <div key={`${img}-${i}`} className="w-36">
            <div className="relative w-36 h-24 bg-gray-100 border border-gray-200">
              <Image src={img} alt={`Imagen ${i + 1}`} fill className="object-cover" sizes="144px" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full"
                aria-label={`Quitar imagen ${i + 1}`}
              >
                <X size={10} />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white font-body text-[10px] px-1.5 rounded">
                {i + 1}
              </span>
            </div>
            <div className="flex justify-center gap-1 mt-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="p-1 text-gray-400 hover:text-[#029CDC] disabled:opacity-25" aria-label="Mover antes">
                <ArrowLeft size={13} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1}
                className="p-1 text-gray-400 hover:text-[#029CDC] disabled:opacity-25" aria-label="Mover después">
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}

        <label className={`w-36 h-24 border-2 border-dashed flex flex-col items-center justify-center transition-colors ${uploading ? 'border-gray-200 cursor-wait opacity-60' : 'border-gray-200 hover:border-[#029CDC] cursor-pointer'}`}>
          <Upload size={18} className="text-gray-400" />
          <span className="font-body text-xs text-gray-400 mt-1">
            {uploading ? 'Subiendo…' : 'Agregar'}
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="font-body text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
