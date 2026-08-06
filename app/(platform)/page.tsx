import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store } from 'lucide-react'

export const metadata = { title: 'Camisetas Carpi Platform' }

export default async function PlatformPage() {
  const supabase = createClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#00273E] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <p className="font-heading text-[#029CDC] text-sm tracking-widest mb-2">PLATAFORMA</p>
        <h1 className="font-heading text-5xl text-white tracking-widest">CAMISETAS CARPI</h1>
        <p className="font-body text-white/50 mt-3">
          Seleccioná una tienda o creá la tuya.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-lg">
        {(tenants ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/${t.slug}`}
            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#029CDC]/50 p-5 transition-all"
          >
            <div className="w-10 h-10 bg-[#029CDC]/20 flex items-center justify-center flex-shrink-0">
              <Store size={20} className="text-[#029CDC]" />
            </div>
            <div>
              <p className="font-heading text-xl text-white tracking-wider">{t.name}</p>
              <p className="font-body text-xs text-white/40">/{t.slug}</p>
            </div>
          </Link>
        ))}

        {(!tenants || tenants.length === 0) && (
          <p className="text-center font-body text-white/40 py-8">
            No hay tiendas configuradas aún.
          </p>
        )}
      </div>
    </div>
  )
}
