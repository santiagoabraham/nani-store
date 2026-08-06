'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Sign in with Supabase Auth.
 * After sign-in the user must have role='admin' and tenant_id matching
 * the tenant they are trying to access.
 */
export async function loginAdmin(
  tenantSlug: string,
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()

  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) {
    return { error: 'Credenciales incorrectas. Verificá tu email y contraseña.' }
  }

  // Confirm user is an admin for THIS tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Error de autenticación.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, tenants(slug)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: 'No tenés permisos de administrador.' }
  }

  const tenantSlugFromDB = (profile as unknown as { tenants: { slug: string } }).tenants?.slug
  if (tenantSlugFromDB !== tenantSlug) {
    await supabase.auth.signOut()
    return { error: 'No tenés acceso a este panel.' }
  }

  redirect(`/${tenantSlug}/admin`)
}

export async function logoutAdmin(tenantSlug: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect(`/${tenantSlug}/admin/login`)
}

/**
 * Returns the Supabase user if authenticated as admin for the given tenant.
 * Returns null otherwise.
 */
export async function getAdminUser(tenantId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.tenant_id !== tenantId) return null

  return { user, profile }
}
