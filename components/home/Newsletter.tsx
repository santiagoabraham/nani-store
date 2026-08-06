'use client'

import { useState } from 'react'
import { StoreSettings } from '@/types'

interface Props { settings: StoreSettings }

export function Newsletter({ settings }: Props) {
  const newsletterTitle = settings.newsletter_title
  const newsletterSubtitle = settings.newsletter_subtitle
  const couponCode = settings.newsletter_coupon_code?.trim() || null
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="py-16 bg-carpi-red">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-heading text-5xl text-white tracking-wider mb-3">
          {newsletterTitle}
        </h2>
        <p className="font-body text-white/80 mb-8">
          {newsletterSubtitle}
        </p>

        {submitted ? (
          <div className="bg-white/20 border border-white/30 px-6 py-4 text-white font-body">
            {/* El cupón se anuncia sólo si hay uno configurado y existe de verdad.
                Antes se prometía "BIENVENIDO" fijo, que no estaba dado de alta:
                quien lo intentaba se lo encontraba rechazado en el checkout. */}
            {couponCode ? (
              <>
                ¡Gracias! Usá este código en tu compra:{' '}
                <span className="font-heading tracking-wider">{couponCode}</span>
              </>
            ) : (
              <>¡Gracias por suscribirte!</>
            )}
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="flex-1 px-4 py-3 font-body text-sm focus:outline-none text-gray-800"
              />
              <button
                type="submit"
                className="bg-carpi-navy text-white font-heading tracking-widest text-sm px-6 py-3 hover:bg-blue-900 transition-colors"
              >
                SUSCRIBIRME
              </button>
            </form>
            {couponCode && (
              <p className="font-body text-xs text-white/60 mt-3">
                Cupón <strong>{couponCode}</strong> disponible al suscribirte
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
