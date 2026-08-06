'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Size, JerseyVersion } from '@/types'
import { track } from '@/lib/analytics'

const COUPONS: Record<string, number> = {
  CARPI10: 10,
  CARPI20: 20,
  RACING: 15,
  BIENVENIDO: 5,
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  couponCode: string | null
  discountPercent: number
  addItem: (product: Product, size: Size, version: JerseyVersion) => void
  removeItem: (productId: string, size: Size, version: JerseyVersion) => void
  updateQuantity: (productId: string, size: Size, version: JerseyVersion, qty: number) => void
  applyCoupon: (code: string) => { success: boolean; message: string }
  removeCoupon: () => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      discountPercent: 0,

      addItem: (product, size, version) => {
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === product.id && i.size === size && i.version === version
          )
          if (idx >= 0) {
            const next = [...state.items]
            next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
            return { items: next, isOpen: true }
          }
          return {
            items: [...state.items, { productId: product.id, product, size, version, quantity: 1 }],
            isOpen: true,
          }
        })
      },

      removeItem: (productId, size, version) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size && i.version === version)
          ),
        })),

      updateQuantity: (productId, size, version, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, size, version)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.size === size && i.version === version
              ? { ...i, quantity: qty }
              : i
          ),
        }))
      },

      applyCoupon: (code) => {
        const key = code.toUpperCase().trim()
        if (COUPONS[key]) {
          set({ couponCode: key, discountPercent: COUPONS[key] })
          return { success: true, message: `¡${COUPONS[key]}% de descuento aplicado!` }
        }
        return { success: false, message: 'Cupón inválido o expirado' }
      },

      removeCoupon: () => set({ couponCode: null, discountPercent: 0 }),

      clearCart: () => set({ items: [], couponCode: null, discountPercent: 0, isOpen: false }),

      openCart: () => {
        track('cart_opened', { item_count: get().getItemCount() })
        set({ isOpen: true })
      },
      closeCart: () => set({ isOpen: false }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      getDiscount: () => {
        const sub = get().getSubtotal()
        return sub * (get().discountPercent / 100)
      },

      getTotal: () => get().getSubtotal() - get().getDiscount(),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'carpi-cart',
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, discountPercent: s.discountPercent }),
    }
  )
)
