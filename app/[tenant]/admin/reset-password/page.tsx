'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/context/TenantContext'
import { AlertCircle, Lock, Check } from 'lucide-react'

type Phase = 'verificando' | 'listo' | 'guardando' | 'ok' | 'invalido'

const MIN_LENGTH = 8

export default function ResetPasswordPage() {
  const { tenant, settings } = useTenant()
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('verificando')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  // Canjea el token del mail por una sesión.
  //
  // Se leen search y hash a mano en vez de useSearchParams porque ese hook
  // obliga a envolver la página en <Suspense> y acá no aporta nada.
  //
  // Supabase manda el token de dos formas según la configuración del proyecto:
  //  - PKCE: ?code=... y hay que canjearlo con exchangeCodeForSession
  //  - Implícita: #access_token=...&type=recovery, que supabase-js detecta solo
  //    al instanciarse y emite PASSWORD_RECOVERY
  // Se contemplan las dos para no depender de cómo quede configurado el proyecto.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (!cancelled) setPhase('listo')
      }
    })

    ;(async () => {
      // 1. Flujo PKCE: el token viene como ?code y se canjea.
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exErr) {
          setError('El enlace es inválido o ya venció. Pedí uno nuevo desde el login.')
          setPhase('invalido')
          return
        }
        setPhase('listo')
        return
      }

      // 2. Flujo implícito: los tokens vienen en el hash y se instalan A MANO.
      //
      //    No alcanza con esperar a que supabase-js los detecte solo: el cliente
      //    de @supabase/ssr está armado para PKCE sobre cookies y NO consume el
      //    hash del flujo implícito. Confiar en detectSessionInUrl dejaba la
      //    página colgada con el token entero delante y sin sesión.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (cancelled) return
        if (setErr) {
          setError('El enlace es inválido o ya venció. Pedí uno nuevo desde el login.')
          setPhase('invalido')
          return
        }
        // Se limpia el hash para que los tokens no queden en la barra de
        // direcciones ni en el historial del navegador.
        window.history.replaceState(null, '', window.location.pathname)
        setPhase('listo')
        return
      }

      // 3. Sin token en la URL: puede haber una sesión de recuperación ya activa.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (session) { setPhase('listo'); return }

      setError('Entraste sin un enlace de recuperación válido.')
      setPhase('invalido')
    })()

    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`La contraseña necesita al menos ${MIN_LENGTH} caracteres.`)
      return
    }
    if (password !== confirm) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setPhase('guardando')
    const supabase = createClient()
    const { error: upErr } = await supabase.auth.updateUser({ password })

    if (upErr) {
      setError(upErr.message || 'No se pudo cambiar la contraseña.')
      setPhase('listo')
      return
    }

    setPhase('ok')
    // La sesión ya queda activa con la contraseña nueva: se entra directo.
    setTimeout(() => router.push(`/${tenant.slug}/admin`), 1500)
  }

  const inputCls =
    'w-full bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-body text-sm focus:outline-none focus:border-[#029CDC] transition-colors'
  const labelCls = 'font-body text-xs text-white/60 uppercase tracking-wider block mb-1.5'

  return (
    <div className="min-h-screen bg-[#00273E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="font-heading text-[#029CDC] tracking-widest text-sm mb-1">NUEVA CONTRASEÑA</p>
          <h1 className="font-heading text-4xl text-white tracking-widest">
            {settings.store_name.toUpperCase()}
          </h1>
        </div>

        {phase === 'verificando' && (
          <p className="text-center font-body text-sm text-white/50">Validando el enlace…</p>
        )}

        {phase === 'invalido' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
            <Link
              href={`/${tenant.slug}/admin/login`}
              className="block text-center font-body text-sm text-[#029CDC] hover:underline"
            >
              Volver al login
            </Link>
          </div>
        )}

        {phase === 'ok' && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
            <Check size={16} className="text-emerald-400 flex-shrink-0" />
            <p className="font-body text-sm text-emerald-400">
              Contraseña actualizada. Entrando al panel…
            </p>
          </div>
        )}

        {(phase === 'listo' || phase === 'guardando') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
                className={inputCls}
              />
              <p className="font-body text-xs text-white/30 mt-1.5">
                Mínimo {MIN_LENGTH} caracteres.
              </p>
            </div>

            <div>
              <label className={labelCls}>Repetir contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={phase === 'guardando'}
              className="w-full bg-[#029CDC] text-white font-heading tracking-widest text-sm py-3.5 hover:bg-[#0285b5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Lock size={15} />
              {phase === 'guardando' ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
