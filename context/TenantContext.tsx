'use client'

import { createContext, useContext } from 'react'
import { TenantContextValue } from '@/types'

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue
  children: React.ReactNode
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

/** Use inside any component under app/[tenant]/ to access tenant + settings. */
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used inside a TenantProvider')
  return ctx
}
