'use client'

import { useState, useTransition } from 'react'
import { StoreSettings } from '@/types'
import { CarouselImagesField } from '@/components/admin/CarouselImagesField'
import { Check } from 'lucide-react'

interface Props {
  tenantId: string
  tenantSlug: string
  initialSettings: StoreSettings
}

export function StoreSettingsForm({ tenantSlug, initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [mpToken, setMpToken] = useState('')
  const [mpWebhookSecret, setMpWebhookSecret] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: keyof StoreSettings, val: string) =>
    setSettings((s) => ({ ...s, [key]: val }))

  const handleSave = () => {
    startTransition(async () => {
      setError('')
      const body: Record<string, unknown> = {
        settings: {
          store_name: settings.store_name,
          primary_color: settings.primary_color,
          currency: settings.currency,
          email_from: settings.email_from,
          hero_title: settings.hero_title,
          hero_subtitle: settings.hero_subtitle,
          hero_cta: settings.hero_cta,
          hero_secondary: settings.hero_secondary,
          newsletter_title: settings.newsletter_title,
          newsletter_subtitle: settings.newsletter_subtitle,
          footer_tagline: settings.footer_tagline,
          footer_instagram: settings.footer_instagram,
          footer_email: settings.footer_email,
          // Los numéricos viajan como Number: los inputs devuelven string y
          // Postgres rechaza '' en una columna NUMERIC NOT NULL.
          installments: Number(settings.installments) || 1,
          cash_discount_percent: Number(settings.cash_discount_percent) || 0,
          ship_home_caba: Number(settings.ship_home_caba) || 0,
          ship_branch_caba: Number(settings.ship_branch_caba) || 0,
          ship_home_rest: Number(settings.ship_home_rest) || 0,
          ship_branch_rest: Number(settings.ship_branch_rest) || 0,
          carousel_images: settings.carousel_images ?? [],
          // Vacío se guarda como null: el newsletter interpreta null como
          // "no anunciar ningún cupón".
          newsletter_coupon_code: settings.newsletter_coupon_code?.trim() || null,
          returns_note: settings.returns_note ?? '',
        },
      }

      if (mpToken.trim() && settings.mp_public_key?.trim()) {
        body.mpToken = mpToken.trim()
        body.mpPublicKey = settings.mp_public_key.trim()
      }

      if (mpWebhookSecret.trim()) {
        body.mpWebhookSecret = mpWebhookSecret.trim()
      }

      const res = await fetch(`/${tenantSlug}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setError('Error al guardar. Verificá que estás logueado como admin.')
        return
      }

      setMpToken('')
      setMpWebhookSecret('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const field = (key: keyof StoreSettings, label: string, type = 'text') => (
    <div>
      <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={(settings[key] as string) ?? ''}
        onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]"
      />
    </div>
  )

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Branding */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">BRANDING</h2>
        {field('store_name', 'Nombre de la tienda')}
        {field('primary_color', 'Color principal (hex)', 'color')}
        {field('currency', 'Moneda')}
        {field('email_from', 'Email remitente', 'email')}
      </section>

      {/* MercadoPago */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">MERCADO PAGO</h2>
        <p className="font-body text-xs text-gray-400">Las credenciales se guardan de forma segura y nunca se exponen al navegador.</p>
        <div>
          <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Access Token (dejar vacío para no cambiar)</label>
          <input
            type="password"
            value={mpToken}
            onChange={(e) => setMpToken(e.target.value)}
            placeholder="APP_USR-..."
            className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]"
          />
        </div>
        {field('mp_public_key', 'Public Key')}
        <div>
          <label className="font-body text-xs text-gray-500 uppercase tracking-wider block mb-1">Webhook Secret (dejar vacío para no cambiar)</label>
          <input
            type="password"
            value={mpWebhookSecret}
            onChange={(e) => setMpWebhookSecret(e.target.value)}
            placeholder="Secreto de firma de webhooks de MP"
            className="w-full border border-gray-200 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#029CDC]"
          />
          <p className="font-body text-xs text-gray-400 mt-1">
            Configurá la URL de webhook en MercadoPago: <code className="bg-gray-100 px-1">/{tenantSlug}/api/webhooks/mercadopago</code>
          </p>
        </div>
      </section>

      {/* Condiciones de pago */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">CONDICIONES DE PAGO</h2>
        <p className="font-body text-xs text-gray-400">
          Aplican a toda la tienda. Al cambiarlos se actualizan de una todos los productos,
          el checkout y lo que se le manda a MercadoPago.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {field('installments', 'Cuotas sin interés', 'number')}
          {field('cash_discount_percent', '% off por efectivo o transferencia', 'number')}
        </div>
        <p className="font-body text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2">
          Ojo: el campo de cuotas sólo fija el <strong>tope</strong> que ve el comprador en
          MercadoPago. Que esas cuotas sean realmente sin interés depende de la campaña de
          cuotas que tengas activa en tu cuenta de MercadoPago.
        </p>
      </section>

      {/* Envíos */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">TARIFAS DE ENVÍO</h2>
        <p className="font-body text-xs text-gray-400">
          Valores fijos por zona y modalidad, provisorios hasta conectar la cotización en
          vivo de Correo Argentino. El costo queda congelado en cada pedido: subir las
          tarifas no reescribe los pedidos ya hechos.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {field('ship_home_caba', 'CABA y GBA — a domicilio', 'number')}
          {field('ship_branch_caba', 'CABA y GBA — a sucursal', 'number')}
          {field('ship_home_rest', 'Resto del país — a domicilio', 'number')}
          {field('ship_branch_rest', 'Resto del país — a sucursal', 'number')}
        </div>
      </section>

      {/* Content */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">CONTENIDO — HERO</h2>
        {field('hero_title', 'Título')}
        {field('hero_subtitle', 'Subtítulo')}
        {field('hero_cta', 'Botón principal')}
        {field('hero_secondary', 'Botón secundario')}
        <CarouselImagesField
          images={settings.carousel_images ?? []}
          onChange={(imgs) => setSettings((s) => ({ ...s, carousel_images: imgs }))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">NEWSLETTER</h2>
        {field('newsletter_title', 'Título')}
        {field('newsletter_subtitle', 'Subtítulo')}
        {field('newsletter_coupon_code', 'Cupón que se anuncia (vacío = ninguno)')}
        <p className="font-body text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2">
          El código que pongas acá se le promete a quien se suscriba. Asegurate de que
          exista y esté activo en la sección Cupones, o dejalo vacío.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">POLÍTICAS</h2>
        {field('returns_note', 'Devoluciones (vacío = no se menciona)')}
        <p className="font-body text-xs text-gray-400">
          Aparece en el desplegable “Envíos y devoluciones” de cada producto. Los bloques
          de beneficios de la portada y de la ficha se editan en la sección Contenido.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-wider text-gray-700 border-b border-gray-100 pb-2">FOOTER</h2>
        {field('footer_tagline', 'Tagline')}
        {field('footer_instagram', 'Instagram')}
        {field('footer_email', 'Email de contacto', 'email')}
      </section>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="flex items-center gap-2 bg-[#029CDC] text-white font-heading tracking-wider text-sm px-8 py-3 hover:opacity-90 disabled:opacity-60"
      >
        {saved ? <><Check size={16} /> GUARDADO</> : isPending ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
      </button>
    </div>
  )
}
