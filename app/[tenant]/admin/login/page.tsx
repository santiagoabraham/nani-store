import { redirect } from 'next/navigation'
import { requireTenant } from '@/lib/tenant'
import { getAdminUser } from '@/lib/auth/adminAuth'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

interface Props { params: { tenant: string } }

/**
 * Login del panel.
 *
 * El middleware deja pasar esta ruta sin sesión — es la única forma de poder
 * loguearse. Pero eso también significa que un admin YA logueado puede llegar
 * acá, y en ese caso el layout del admin le monta el sidebar completo alrededor
 * del formulario: parece que el panel se ve sin haber iniciado sesión.
 *
 * Por eso, si ya hay sesión válida para este tenant, se manda derecho al panel
 * en vez de mostrar un login que no hace falta.
 */
export default async function AdminLoginPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)

  const admin = await getAdminUser(tenant.id)
  if (admin) redirect(`/${params.tenant}/admin`)

  return <AdminLoginForm />
}
