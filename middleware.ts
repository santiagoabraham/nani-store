import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ----------------------------------------------------------------
// Legacy single-tenant route redirects
// Visitors hitting the old paths get sent to the default tenant.
// Set DEFAULT_TENANT to match your tenant slug.
// ----------------------------------------------------------------
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_SLUG ?? 'my-store'

const LEGACY_PREFIXES = ['/products', '/checkout', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Redirect root and legacy routes to the default tenant
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_TENANT}`, request.url))
  }

  const isLegacy = LEGACY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isLegacy) {
    return NextResponse.redirect(new URL(`/${DEFAULT_TENANT}${pathname}`, request.url))
  }

  // 2. For [tenant]/admin routes: verify Supabase session
  //    Pattern: /{tenant}/admin/** (but NOT /{tenant}/admin/login
  //    ni /{tenant}/admin/reset-password)
  //
  //    reset-password queda afuera a propósito: se llega desde el mail de
  //    recuperación SIN sesión — el token todavía no se canjeó cuando corre
  //    el middleware. Si lo protegiéramos, el link del mail rebotaría al
  //    login y la recuperación sería imposible.
  const adminMatch = pathname.match(/^\/([^/]+)\/admin(\/(?!login|reset-password).+)?$/)
  if (adminMatch) {
    const tenantSlug = adminMatch[1]
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // getUser() validates the JWT server-side on every request.
    // getSession() only reads the local cookie — a deleted or revoked user
    // would pass middleware for the entire JWT lifetime if we used getSession().
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/admin/login`, request.url)
      )
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Run middleware on all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
