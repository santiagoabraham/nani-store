'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { products as initialProducts, categories as initialCategories } from '@/lib/data'
import type { Product, ProductCategory } from '@/types'

interface ProductsState {
  products: Product[]
  categories: ProductCategory[]
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addCategory: (category: ProductCategory) => void
  updateCategory: (id: string, updates: Partial<ProductCategory>) => void
  deleteCategory: (id: string) => void
  resetToDefaults: () => void
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set) => ({
      products: initialProducts,
      categories: initialCategories,
      addProduct: (product) =>
        set((s) => ({ products: [...s.products, product] })),
      updateProduct: (id, updates) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      addCategory: (cat) =>
        set((s) => ({ categories: [...s.categories, cat] })),
      updateCategory: (id, updates) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      resetToDefaults: () =>
        set({ products: initialProducts, categories: initialCategories }),
    }),
    { name: 'carpi-products' }
  )
)
