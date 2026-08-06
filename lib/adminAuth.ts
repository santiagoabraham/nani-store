'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const CREDENTIALS = { email: 'admin@camisetascarpi.com', password: 'carpi2024' }
const TOKEN = 'carpi_admin_2024'

export async function loginAdmin(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
    cookies().set('admin_session', TOKEN, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    redirect('/admin')
  }

  return { error: 'Credenciales incorrectas. Verificá tu email y contraseña.' }
}

export async function logoutAdmin() {
  cookies().delete('admin_session')
  redirect('/admin/login')
}
