'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/store/cartStore'
import { useTenant } from '@/context/TenantContext'
import { formatPriceARS } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { cashDiscountAmount, paymentTerms, qualifiesForCashDiscount } from '@/lib/pricing'
import {
  shippingCost, SHIPPING_ZONES, SHIPPING_METHODS,
  ZONE_LABELS, METHOD_LABELS, METHOD_HINTS,
  type ShippingZone, type ShippingMethod,
} from '@/lib/shipping'
import type { OrderRequest, PaymentMethod } from '@/types'
import { ChevronLeft, CreditCard, Smartphone, Check, Tag, X, Banknote, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Step = 'info' | 'payment' | 'success'

interface FormData {
  name: string; email: string; phone: string
  address: string; city: string; state: string; zip: string; country: string
}

const INITIAL_FORM: FormData = {
  name: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '', country: 'Argentina',
}

export default function CheckoutPage() {
  const { tenant, settings } = useTenant()
  const cart = useCart()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<Step>('info')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [shippingZone, setShippingZone] = useState<ShippingZone>('caba_gba')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('domicilio')
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [orderNumber, setOrderNumber] = useState('')

  const { items, couponCode, discountPercent, getSubtotal, getDiscount, applyValidatedCoupon, removeCoupon, clearCart } = cart

  // Los totales se recalculan acá porque el carrito no sabe de envío ni de
  // descuento por efectivo. El servidor los vuelve a calcular igual: esto es
  // sólo para que el comprador vea el número correcto antes de confirmar.
  const terms = paymentTerms(settings)
  const shipCost = shippingCost(settings, shippingZone, shippingMethod)
  const couponDiscount = getDiscount()
  const afterCoupon = Math.max(0, getSubtotal() - couponDiscount)
  const cashDiscount = qualifiesForCashDiscount(paymentMethod)
    ? cashDiscountAmount(afterCoupon, terms.cashDiscountPercent)
    : 0
  const grandTotal = afterCoupon - cashDiscount + shipCost

  if (step !== 'success' && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-heading text-2xl tracking-wider text-gray-400">CARRITO VACÍO</p>
        <Link href={`/${tenant.slug}/products`}>
          <Button variant="primary">VER CAMISETAS</Button>
        </Link>
      </div>
    )
  }

  const validate = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
    if (!form.phone.trim()) e.phone = 'Requerido'
    if (!form.address.trim()) e.address = 'Requerido'
    if (!form.city.trim()) e.city = 'Requerido'
    if (!form.state.trim()) e.state = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

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

  const handlePlaceOrder = () => {
    startTransition(async () => {
      const payload: OrderRequest = {
        customer: form,
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          version: i.version,
          quantity: i.quantity,
        })),
        discountCode: couponCode,
        paymentMethod,
        // Sólo zona y modalidad: el costo lo resuelve el servidor.
        shipping: { zone: shippingZone, method: shippingMethod },
      }

      const res = await fetch(`/${tenant.slug}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error ?? 'Error al procesar el pedido. Intenta nuevamente.')
        return
      }

      const { order, mpInitPoint, mpError } = await res.json()

      track('order_completed', {
        order_id: order.id,
        total: grandTotal,
        item_count: items.reduce((s, i) => s + i.quantity, 0),
        payment_method: paymentMethod,
      })

      // For MercadoPago: redirect to the payment page.
      // Cart is cleared after successful return via the success page.
      if (mpInitPoint) {
        window.location.href = mpInitPoint
        return
      }

      if (mpError) {
        alert(mpError)
      }

      setOrderNumber(order.number)
      clearCart()
      setStep('success')
    })
  }

  const field = (
    key: keyof FormData,
    label: string,
    type = 'text',
    span = false
  ) => (
    <div className={span ? 'md:col-span-2' : ''}>
      <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className={`w-full border px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC] transition-colors ${
          errors[key] ? 'border-red-400' : 'border-gray-200'
        }`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  // ── SUCCESS ────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-500 flex items-center justify-center rounded-full">
          <Check size={32} className="text-white" />
        </div>
        <div>
          <h1 className="font-heading text-4xl text-gray-900 tracking-wider">¡PEDIDO CONFIRMADO!</h1>
          <p className="font-body text-gray-500 mt-2">Tu pedido <strong>{orderNumber}</strong> fue recibido.</p>
          <p className="font-body text-gray-400 text-sm mt-1">
            Recibirás un email de confirmación en <strong>{form.email}</strong>.
          </p>
        </div>
        <Link href={`/${tenant.slug}`}>
          <Button variant="primary" size="lg">SEGUIR COMPRANDO</Button>
        </Link>
      </div>
    )
  }

  // ── ORDER SUMMARY (shared sidebar) ────────────────────────
  const Summary = () => (
    <div className="bg-gray-50 p-6 space-y-4">
      <h3 className="font-heading text-lg tracking-wider text-gray-900">RESUMEN</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={`${item.productId}-${item.size}-${item.version}`} className="flex gap-3">
            <div className="relative w-14 h-16 bg-gray-100 flex-shrink-0">
              {item.product.images[0] && (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-gray-900 leading-tight">{item.product.name}</p>
              <p className="font-body text-xs text-gray-400">T{item.size} · {item.version === 'Home' ? 'Titular' : item.version === 'Away' ? 'Alternativa' : 'Tercera'} · x{item.quantity}</p>
            </div>
            <p className="font-heading text-sm">{formatPriceARS(item.product.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      {/* Coupon */}
      {couponCode ? (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2">
          <span className="font-heading text-sm text-emerald-700 flex items-center gap-2">
            <Tag size={13} /> {couponCode} — {discountPercent}% OFF
          </span>
          <button onClick={removeCoupon}><X size={13} className="text-emerald-500" /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
            placeholder="Código de descuento"
            className="flex-1 border border-gray-200 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#029CDC]"
          />
          <button
            onClick={handleApplyCoupon}
            className="bg-[#00273E] text-white font-heading text-xs tracking-wider px-4 hover:bg-[#029CDC] transition-colors"
          >
            APLICAR
          </button>
        </div>
      )}
      {couponMsg && <p className={`text-xs font-body ${couponMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg.text}</p>}

      <div className="border-t border-gray-200 pt-4 space-y-2 font-body text-sm">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPriceARS(getSubtotal())}</span></div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Cupón ({discountPercent}%)</span><span>-{formatPriceARS(couponDiscount)}</span>
          </div>
        )}
        {cashDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Efectivo/transferencia ({terms.cashDiscountPercent}%)</span>
            <span>-{formatPriceARS(cashDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Envío — {shippingMethod === 'sucursal' ? 'Sucursal' : 'Domicilio'}</span>
          <span>{formatPriceARS(shipCost)}</span>
        </div>
        <div className="flex justify-between font-heading text-xl text-gray-900 border-t border-gray-200 pt-2">
          <span>TOTAL</span><span>{formatPriceARS(grandTotal)}</span>
        </div>
        {!qualifiesForCashDiscount(paymentMethod) && (
          <p className="font-body text-xs text-emerald-600 pt-1">
            Pagando en efectivo o por transferencia ahorrás{' '}
            {formatPriceARS(cashDiscountAmount(afterCoupon, terms.cashDiscountPercent))}.
          </p>
        )}
      </div>
    </div>
  )

  // ── STEP: INFO ──────────────────────────────────────────────
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link href={`/${tenant.slug}/products`} className="flex items-center gap-2 font-body text-sm text-gray-400 hover:text-gray-600 mb-8">
            <ChevronLeft size={16} /> Seguir comprando
          </Link>
          <h1 className="font-heading text-4xl tracking-wider text-gray-900 mb-8">CHECKOUT</h1>

          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3 space-y-6">
              <h2 className="font-heading text-xl tracking-wider text-gray-700">DATOS DE ENVÍO</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {field('name', 'Nombre completo', 'text', true)}
                {field('email', 'Email', 'email')}
                {field('phone', 'Teléfono', 'tel')}
                {field('address', 'Dirección', 'text', true)}
                {field('city', 'Ciudad')}
                {field('state', 'Provincia')}
                {field('zip', 'Código postal')}
              </div>

              {/* Envío: zona × modalidad. El costo sale de las tarifas de la
                  tienda, que se editan en el panel. */}
              <div className="pt-2">
                <h2 className="font-heading text-xl tracking-wider text-gray-700 mb-4">FORMA DE ENVÍO</h2>

                <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2">Zona</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  {SHIPPING_ZONES.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setShippingZone(zone)}
                      className={`border-2 px-4 py-3 text-left transition-colors ${shippingZone === zone ? 'border-[#029CDC] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="font-heading text-sm tracking-wider block">{ZONE_LABELS[zone]}</span>
                      <span className="font-body text-xs text-gray-400">
                        desde {formatPriceARS(shippingCost(settings, zone, 'sucursal'))}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2">Modalidad</p>
                <div className="space-y-3">
                  {SHIPPING_METHODS.map((method) => {
                    const Icon = method === 'sucursal' ? Store : Truck
                    const cost = shippingCost(settings, shippingZone, method)
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setShippingMethod(method)}
                        className={`w-full flex items-center gap-4 border-2 p-4 text-left transition-colors ${shippingMethod === method ? 'border-[#029CDC] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${shippingMethod === method ? 'border-[#029CDC]' : 'border-gray-300'}`}>
                          {shippingMethod === method && <div className="w-2.5 h-2.5 rounded-full bg-[#029CDC]" />}
                        </div>
                        <Icon size={20} className="text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-heading text-base tracking-wider">{METHOD_LABELS[method].toUpperCase()}</p>
                          <p className="font-body text-xs text-gray-400">{METHOD_HINTS[method]}</p>
                        </div>
                        <span className="font-heading text-lg text-gray-900 flex-shrink-0">
                          {formatPriceARS(cost)}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="font-body text-xs text-gray-400 mt-3">
                  Tarifas de Correo Argentino. El plazo de entrega se confirma al despachar el pedido.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => { if (validate()) setStep('payment') }}
              >
                CONTINUAR AL PAGO
              </Button>
            </div>
            <div className="lg:col-span-2"><Summary /></div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: PAYMENT ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <button onClick={() => setStep('info')} className="flex items-center gap-2 font-body text-sm text-gray-400 hover:text-gray-600 mb-8">
          <ChevronLeft size={16} /> Volver a datos de envío
        </button>
        <h1 className="font-heading text-4xl tracking-wider text-gray-900 mb-8">MÉTODO DE PAGO</h1>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-4">
            {/* Card option */}
            <label className={`flex items-center gap-4 border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-[#029CDC] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="pm" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="sr-only" />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'card' ? 'border-[#029CDC]' : 'border-gray-300'}`}>
                {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#029CDC]" />}
              </div>
              <CreditCard size={20} className="text-gray-500 flex-shrink-0" />
              <div>
                <p className="font-heading text-base tracking-wider">TARJETA DE CRÉDITO / DÉBITO</p>
                <p className="font-body text-xs text-gray-400">Visa, Mastercard, American Express</p>
              </div>
            </label>

            {paymentMethod === 'card' && (
              <div className="border border-gray-100 p-5 space-y-4 bg-gray-50">
                <div>
                  <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Número de tarjeta</label>
                  <input className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Vencimiento</label>
                    <input className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]" placeholder="MM/AA" maxLength={5} />
                  </div>
                  <div>
                    <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">CVV</label>
                    <input className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]" placeholder="123" maxLength={4} />
                  </div>
                </div>
              </div>
            )}

            {/* MercadoPago option */}
            <label className={`flex items-center gap-4 border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'mercadopago' ? 'border-[#029CDC] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="pm" value="mercadopago" checked={paymentMethod === 'mercadopago'} onChange={() => { setPaymentMethod('mercadopago'); track('payment_method_selected', { method: 'mercadopago' }) }} className="sr-only" />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'mercadopago' ? 'border-[#029CDC]' : 'border-gray-300'}`}>
                {paymentMethod === 'mercadopago' && <div className="w-2.5 h-2.5 rounded-full bg-[#029CDC]" />}
              </div>
              <Smartphone size={20} className="text-[#009EE3] flex-shrink-0" />
              <div>
                <p className="font-heading text-base tracking-wider">MERCADO PAGO</p>
                <p className="font-body text-xs text-gray-400">
                  {terms.installments} cuotas sin interés
                </p>
              </div>
            </label>

            {paymentMethod === 'mercadopago' && (
              <div className="border border-blue-100 bg-blue-50 p-4 space-y-1">
                <p className="font-heading text-sm text-[#009EE3] tracking-wider">PAGÁ CON MERCADO PAGO</p>
                <p className="font-body text-sm text-gray-600">Al confirmar serás redirigido a la plataforma segura de MercadoPago para completar el pago.</p>
              </div>
            )}

            {/* Efectivo / transferencia — el único con descuento */}
            <label className={`flex items-center gap-4 border-2 p-4 cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="pm" value="cash" checked={paymentMethod === 'cash'} onChange={() => { setPaymentMethod('cash'); track('payment_method_selected', { method: 'cash' }) }} className="sr-only" />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'cash' ? 'border-emerald-500' : 'border-gray-300'}`}>
                {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
              </div>
              <Banknote size={20} className="text-emerald-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-heading text-base tracking-wider">EFECTIVO O TRANSFERENCIA</p>
                <p className="font-body text-xs text-emerald-600">
                  {terms.cashDiscountPercent}% de descuento sobre la mercadería
                </p>
              </div>
            </label>

            {paymentMethod === 'cash' && (
              <div className="border border-emerald-100 bg-emerald-50 p-4 space-y-1">
                <p className="font-heading text-sm text-emerald-700 tracking-wider">COORDINAMOS EL PAGO</p>
                <p className="font-body text-sm text-gray-600">
                  Al confirmar te contactamos para pasarte los datos de transferencia o coordinar
                  el pago en efectivo. El pedido queda reservado mientras tanto.
                </p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4"
              onClick={handlePlaceOrder}
              disabled={isPending}
            >
              {isPending ? 'PROCESANDO...' : `CONFIRMAR PEDIDO — ${formatPriceARS(grandTotal)}`}
            </Button>
            <p className="text-xs text-center font-body text-gray-400">
              🔒 Transacción segura con encriptación SSL
            </p>
          </div>

          <div className="lg:col-span-2"><Summary /></div>
        </div>
      </div>
    </div>
  )
}
