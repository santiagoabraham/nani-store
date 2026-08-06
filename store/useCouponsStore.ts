'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DiscountType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: DiscountType
  value: number
  active: boolean
  uses: number
  maxUses?: number
  createdAt: string
}

const initialCoupons: Coupon[] = [
  { id: '1', code: 'CARPI10', type: 'percent', value: 10, active: true, uses: 47, createdAt: '2025-01-01T00:00:00Z' },
  { id: '2', code: 'CARPI20', type: 'percent', value: 20, active: true, uses: 23, createdAt: '2025-01-01T00:00:00Z' },
  { id: '3', code: 'RACING', type: 'percent', value: 15, active: true, uses: 31, createdAt: '2025-01-01T00:00:00Z' },
  { id: '4', code: 'BIENVENIDO', type: 'percent', value: 5, active: true, uses: 89, createdAt: '2025-01-01T00:00:00Z' },
]

interface CouponsState {
  coupons: Coupon[]
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'uses'>) => void
  updateCoupon: (id: string, updates: Partial<Coupon>) => void
  deleteCoupon: (id: string) => void
  toggleCoupon: (id: string) => void
  validateCoupon: (code: string) => { valid: boolean; coupon?: Coupon; message: string }
  incrementUses: (code: string) => void
}

export const useCouponsStore = create<CouponsState>()(
  persist(
    (set, get) => ({
      coupons: initialCoupons,
      addCoupon: (data) =>
        set((s) => ({
          coupons: [...s.coupons, { ...data, id: String(Date.now()), uses: 0, createdAt: new Date().toISOString() }],
        })),
      updateCoupon: (id, updates) =>
        set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteCoupon: (id) =>
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
      toggleCoupon: (id) =>
        set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
      validateCoupon: (code) => {
        const coupon = get().coupons.find((c) => c.code === code.toUpperCase().trim() && c.active)
        if (!coupon) return { valid: false, message: 'Cupón inválido o expirado' }
        if (coupon.maxUses && coupon.uses >= coupon.maxUses)
          return { valid: false, message: 'Cupón agotado' }
        const label = coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value}`
        return { valid: true, coupon, message: `¡${label} de descuento aplicado!` }
      },
      incrementUses: (code) =>
        set((s) => ({
          coupons: s.coupons.map((c) => (c.code === code.toUpperCase() ? { ...c, uses: c.uses + 1 } : c)),
        })),
    }),
    { name: 'carpi-coupons' }
  )
)
