'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAdmin } from '@/lib/auth/adminAuth'
import { useTenant } from '@/context/TenantContext'
import { AlertCircle, Lock } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#029CDC] text-white font-heading tracking-widest text-sm py-3.5 hover:bg-[#0285b5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      <Lock size={15} />
      {pending ? 'INGRESANDO...' : 'INGRESAR AL PANEL'}
    </button>
  )
}

export default function AdminLoginPage() {
  const { tenant, settings } = useTenant()

  const boundLogin = loginAdmin.bind(null, tenant.slug)
  const [state, action] = useFormState(boundLogin, { error: '' })

  return (
    <div className="min-h-screen bg-[#00273E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="font-heading text-[#029CDC] tracking-widest text-sm mb-1">PANEL ADMIN</p>
          <h1 className="font-heading text-4xl text-white tracking-widest">{settings.store_name.toUpperCase()}</h1>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="font-body text-xs text-white/60 uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-body text-sm focus:outline-none focus:border-[#029CDC] transition-colors"
            />
          </div>

          <div>
            <label className="font-body text-xs text-white/60 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 px-4 py-3 font-body text-sm focus:outline-none focus:border-[#029CDC] transition-colors"
            />
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="font-body text-sm text-red-400">{state.error}</p>
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
