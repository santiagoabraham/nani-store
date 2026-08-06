'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Check, Mail } from 'lucide-react'

interface Props {
  tenantSlug: string
  /** Email ya tipeado en el login, para no pedirlo dos veces. */
  defaultEmail?: string
}

export function ForgotPassword({ tenantSlug, defaultEmail = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    const target = email.trim()
    if (!target) { setError('Escribí tu email.'); return }

    setError('')
    setSending(true)

    // El pedido sale desde el NAVEGADOR a propósito. Con el flujo PKCE,
    // resetPasswordForEmail guarda un code_verifier del lado del cliente y
    // exchangeCodeForSession lo necesita para canjear el token. Si el pedido
    // saliera del servidor, el verifier quedaría allá y el canje fallaría.
    const supabase = createClient()
    const { error: resErr } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/${tenantSlug}/admin/reset-password`,
    })

    setSending(false)

    if (resErr) {
      setError(resErr.message || 'No se pudo enviar el mail. Probá de nuevo.')
      return
    }
    setSent(true)
  }

  const handleOpen = () => {
    // defaultEmail viene del estado de React del login, que NO se entera cuando
    // el navegador autocompleta el campo: Chrome escribe el value directo en el
    // DOM sin disparar onChange. Por eso, si el estado vino vacío, se lee el
    // input real antes de rendirse.
    if (!email) {
      const domValue = document.querySelector<HTMLInputElement>('input[name="email"]')?.value
      if (domValue) setEmail(domValue)
    }
    setOpen(true)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="w-full text-center font-body text-xs text-white/40 hover:text-[#029CDC] transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </button>
    )
  }

  if (sent) {
    return (
      <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
        <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm text-emerald-400">Mail enviado a {email.trim()}.</p>
          <p className="font-body text-xs text-white/40 mt-1">
            Abrí el enlace desde este mismo navegador. Si no llega, revisá spam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-white/15 p-4 space-y-3">
      <p className="font-body text-xs text-white/60 uppercase tracking-wider">
        Recuperar contraseña
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
        placeholder="tu@email.com"
        autoFocus
        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-body text-sm focus:outline-none focus:border-[#029CDC] transition-colors"
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-3 py-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="flex-1 border border-white/20 text-white/60 font-body text-sm py-2.5 hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="flex-1 bg-[#029CDC] text-white font-heading tracking-wider text-xs py-2.5 hover:bg-[#0285b5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Mail size={14} />
          {sending ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
        </button>
      </div>
    </div>
  )
}
