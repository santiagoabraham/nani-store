'use client'

/**
 * Multi-tenant cart store.
 *
 * Each tenant gets its own isolated cart persisted to localStorage under
 * the key `cart-{tenantSlug}`. The store is created once per tenant slug
 * and cached in memory for the lifetime of the page.
 *
 * Usage:
 *   1. Wrap [tenant]/layout.tsx with <CartStoreProvider tenantSlug={...}>
 *   2. In any component: const { items, addItem, ... } = useCart()
 */

import { createContext, useContext, useRef } from 'react'
import { createStore, useStore } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, Product, Size, JerseyVersion } from '@/types'
import { track } from '@/lib/analytics'

// ----------------------------------------------------------------
// State & action types
// ----------------------------------------------------------------
export interface CartState {
  items: CartItem[]
  isOpen: boolean
  couponCode: string | null
  discountPercent: number
  // Actions
  addItem: (product: Product, size: Size, version: JerseyVersion) => void
  removeItem: (productId: string, size: Size, version: JerseyVersion) => void
  updateQuantity: (productId: string, size: Size, version: JerseyVersion, qty: number) => void
  applyValidatedCoupon: (code: string, discountPercent: number) => void
  removeCoupon: () => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  // Computed
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
  getItemCount: () => number
}

type CartStore = ReturnType<typeof buildCartStore>

// ----------------------------------------------------------------
// Factory: creates one store per tenant slug
// ----------------------------------------------------------------
function buildCartStore(tenantSlug: string) {
  return createStore<CartState>()(
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

        // Coupon is validated externally via API; store only records the result.
        applyValidatedCoupon: (code, discount) =>
          set({ couponCode: code.toUpperCase().trim(), discountPercent: discount }),

        removeCoupon: () => set({ couponCode: null, discountPercent: 0 }),

        clearCart: () =>
          set({ items: [], couponCode: null, discountPercent: 0, isOpen: false }),

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
        name: `cart-${tenantSlug}`,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({
          items: s.items,
          couponCode: s.couponCode,
          discountPercent: s.discountPercent,
        }),
      }
    )
  )
}

// ----------------------------------------------------------------
// React Context — one store instance per tenant per page session
// ----------------------------------------------------------------
const CartContext = createContext<CartStore | null>(null)

export function CartStoreProvider({
  tenantSlug,
  children,
}: {
  tenantSlug: string
  children: React.ReactNode
}) {
  const storeRef = useRef<CartStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = buildCartStore(tenantSlug)
  }
  return <CartContext.Provider value={storeRef.current}>{children}</CartContext.Provider>
}

/** Drop-in replacement for the old useCart(). Returns full cart state + actions. */
export function useCart(): CartState {
  const store = useContext(CartContext)
  if (!store) throw new Error('useCart must be used inside CartStoreProvider')
  return useStore(store)
}
