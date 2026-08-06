'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Plus, Minus, Trash2, Tag, ChevronRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/store/cartStore'
import { useTenant } from '@/context/TenantContext'
import { track } from '@/lib/analytics'
import { Button } from '@/components/ui/Button'
import { formatPriceARS } from '@/lib/utils'

export function CartDrawer() {
  const { tenant } = useTenant()
  const {
    items, isOpen, closeCart, removeItem, updateQuantity,
    applyValidatedCoupon, removeCoupon,
    couponCode, discountPercent,
    getSubtotal, getDiscount, getTotal,
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleApplyCoupon = async () => {
    const res = await fetch(`/${tenant.slug}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput }),
    })
    const json = await res.json()
    if (json.valid) {
      applyValidatedCoupon(json.code, json.discountPercent)
      track('coupon_applied', { code: json.code, discount: json.discountPercent })
      setCouponMsg({ text: json.message, ok: true })
      setCouponInput('')
    } else {
      track('coupon_failed', { code: couponInput, reason: json.message })
      setCouponMsg({ text: json.message, ok: false })
    }
    setTimeout(() => setCouponMsg(null), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div ref={overlayRef} className="absolute inset-0 bg-black/50 animate-fade-in" onClick={closeCart} />

      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#00273E]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-white" />
            <h2 className="font-heading text-2xl tracking-wider text-white">TU CARRITO</h2>
            {items.length > 0 && (
              <span className="bg-[#029CDC] text-white font-heading text-sm px-2 py-0.5 ml-1">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 text-white/70 hover:text-white transition-colors" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <ShoppingBag size={64} className="text-gray-200" />
              <p className="font-heading text-2xl text-gray-400 tracking-wider">CARRITO VACÍO</p>
              <p className="font-body text-sm text-gray-400 text-center">
                Aún no agregaste ninguna camiseta. ¡Empezá a armar tu colección!
              </p>
              <Button onClick={closeCart} variant="primary" size="md">VER CAMISETAS</Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.version}`} className="flex gap-4 p-5">
                  <div className="relative w-20 h-24 bg-gray-50 flex-shrink-0">
                    {item.product.images[0] && (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs text-gray-400 uppercase tracking-wider">{item.product.team}</p>
                    <h4 className="font-heading text-base text-gray-900 leading-tight mb-1">{item.product.name}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-body text-gray-500 bg-gray-100 px-2 py-0.5">T{item.size}</span>
                      <span className="text-xs font-body text-gray-500 bg-gray-100 px-2 py-0.5">
                        {item.version === 'Home' ? 'Titular' : item.version === 'Away' ? 'Alternativa' : 'Tercera'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200">
                        <button onClick={() => updateQuantity(item.productId, item.size, item.version, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#029CDC] transition-colors"><Minus size={14} /></button>
                        <span className="w-8 text-center font-heading text-base">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.size, item.version, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#029CDC] transition-colors"><Plus size={14} /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-lg text-gray-900">{formatPriceARS(item.product.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.productId, item.size, item.version)} className="text-gray-300 hover:text-red-400 transition-colors" aria-label="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            {/* Coupon */}
            <div>
              {couponCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-emerald-600" />
                    <span className="font-heading text-sm text-emerald-700 tracking-wider">{couponCode} — {discountPercent}% OFF</span>
                  </div>
                  <button onClick={removeCoupon}><X size={14} className="text-emerald-500" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Código de descuento"
                    className="flex-1 border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]"
                  />
                  <button onClick={handleApplyCoupon} className="bg-[#00273E] text-white font-heading tracking-wider text-sm px-4 hover:bg-[#029CDC] transition-colors">
                    APLICAR
                  </button>
                </div>
              )}
              {couponMsg && (
                <p className={`text-xs font-body mt-1 ${couponMsg.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{couponMsg.text}</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPriceARS(getSubtotal())}</span></div>
              {getDiscount() > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Descuento ({discountPercent}%)</span><span>-{formatPriceARS(getDiscount())}</span></div>
              )}
              <div className="flex justify-between text-gray-500"><span>Envío</span><span className="text-emerald-600">Gratis</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-heading text-xl text-gray-900 tracking-wider">
                <span>TOTAL</span><span>{formatPriceARS(getTotal())}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <Link
                href={`/${tenant.slug}/checkout`}
                onClick={() => {
                  track('checkout_started', { item_count: items.reduce((s, i) => s + i.quantity, 0), subtotal: getSubtotal() })
                  closeCart()
                }}
              >
                <Button variant="primary" size="lg" className="w-full justify-between">
                  <span>FINALIZAR COMPRA</span>
                  <ChevronRight size={18} />
                </Button>
              </Link>
              <button onClick={closeCart} className="w-full text-center font-body text-sm text-gray-400 hover:text-[#029CDC] transition-colors py-1">
                Continuar comprando
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
