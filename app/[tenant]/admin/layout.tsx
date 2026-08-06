import { requireTenant } from '@/lib/tenant'
import { getAdminUser } from '@/lib/auth/adminAuth'
import { Sidebar } from '@/components/admin/Sidebar'

interface Props {
  children: React.ReactNode
  params: { tenant: string }
}

export const metadata = { title: 'Admin Panel' }

export default async function AdminLayout({ children, params }: Props) {
  const { tenant } = await requireTenant(params.tenant)

  // Login page is public — render without sidebar
  // (middleware already blocked non-session users from reaching here)
  const admin = await getAdminUser(tenant.id)

  // No session — middleware already redirects /admin/* to /admin/login,
  // so the only unauthenticated child that reaches here is the login page itself.
  // Render it without the sidebar instead of redirecting (which would loop).
  if (!admin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar tenantSlug={params.tenant} adminEmail={admin.user.email ?? ''} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
