import { NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/tenant'
import { getAdminUser } from '@/lib/auth/adminAuth'
import type { Tenant, StoreSettings } from '@/types'

// ----------------------------------------------------------------
// Typed API error — thrown inside route handlers and caught at
// the boundary to produce a consistent JSON error response.
// ----------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Convenience response builder used in catch blocks
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

// ----------------------------------------------------------------
// getTenantFromRequest
//
// Centralized tenant resolution for all API route handlers.
// Resolves the tenant from the URL slug (params.tenant), queries
// the DB, and throws ApiError(404) if not found.
//
// This is the single source of truth for tenant resolution in
// API routes. No route should call getTenantBySlug directly.
// ----------------------------------------------------------------
export async function getTenantFromRequest(
  tenantSlug: string
): Promise<{ tenant: Tenant; settings: StoreSettings }> {
  const result = await getTenantBySlug(tenantSlug)
  if (!result) throw new ApiError('Store not found', 404)
  return result
}

// ----------------------------------------------------------------
// requireAdminFromRequest
//
// Like getTenantFromRequest but additionally verifies that the
// caller has an active Supabase session with role='admin' for
// this specific tenant. Throws ApiError(401) otherwise.
//
// Use this on every admin-only API route (product CRUD, etc.).
// ----------------------------------------------------------------
export async function requireAdminFromRequest(
  tenantSlug: string
): Promise<{ tenant: Tenant; settings: StoreSettings }> {
  const { tenant, settings } = await getTenantFromRequest(tenantSlug)
  const admin = await getAdminUser(tenant.id)
  if (!admin) throw new ApiError('Unauthorized', 401)
  return { tenant, settings }
}

// ----------------------------------------------------------------
// withTenant / withAdmin
//
// Higher-order wrappers that handle ApiError automatically.
// Usage:
//   export const DELETE = withAdmin(async (req, { tenant }) => {
//     await deleteProduct(id, tenant.id)
//     return NextResponse.json({ ok: true })
//   })
// ----------------------------------------------------------------
type RouteContext = { params: Record<string, string> }
type HandlerWithTenant<T extends RouteContext> = (
  req: Request,
  ctx: T & { tenant: Tenant; settings: StoreSettings }
) => Promise<NextResponse>

export function withTenant<T extends RouteContext>(
  handler: HandlerWithTenant<T>
) {
  return async (req: Request, ctx: T): Promise<NextResponse> => {
    try {
      const { tenant, settings } = await getTenantFromRequest(ctx.params.tenant)
      return await handler(req, { ...ctx, tenant, settings })
    } catch (e) {
      if (e instanceof ApiError) return apiError(e.message, e.status)
      console.error('[API] unhandled error:', e)
      return apiError('Internal server error', 500)
    }
  }
}

export function withAdmin<T extends RouteContext>(
  handler: HandlerWithTenant<T>
) {
  return async (req: Request, ctx: T): Promise<NextResponse> => {
    try {
      const { tenant, settings } = await requireAdminFromRequest(ctx.params.tenant)
      return await handler(req, { ...ctx, tenant, settings })
    } catch (e) {
      if (e instanceof ApiError) return apiError(e.message, e.status)
      console.error('[API] unhandled error:', e)
      return apiError('Internal server error', 500)
    }
  }
}
