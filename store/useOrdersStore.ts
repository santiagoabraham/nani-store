'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  team: string
  size: string
  version: string
  quantity: number
  price: number
  image: string
}

export interface Order {
  id: string
  number: string
  createdAt: string
  status: OrderStatus
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
  }
  items: OrderItem[]
  subtotal: number
  discount: number
  discountCode?: string
  total: number
  paymentMethod: string
}

const mockOrders: Order[] = [
  {
    id: '1', number: 'CC-001', createdAt: '2025-04-01T10:30:00Z', status: 'delivered',
    customer: { name: 'Martín Acuña', email: 'martin.acuna@gmail.com', phone: '+54 11 1234-5678', address: 'Av. Corrientes 1234, Piso 2', city: 'Buenos Aires', state: 'CABA' },
    items: [{ productId: '1', name: 'Camiseta Racing Club Titular 2024', team: 'Racing Club', size: 'L', version: 'Home', quantity: 1, price: 35000, image: 'https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024' }],
    subtotal: 35000, discount: 0, total: 35000, paymentMethod: 'MercadoPago',
  },
  {
    id: '2', number: 'CC-002', createdAt: '2025-04-05T14:20:00Z', status: 'delivered',
    customer: { name: 'Valentina Cruz', email: 'valu.cruz@gmail.com', phone: '+54 11 9876-5432', address: 'Florencio Varela 567', city: 'Avellaneda', state: 'Buenos Aires' },
    items: [{ productId: '3', name: 'Camiseta Argentina Titular 2024', team: 'Selección Argentina', size: 'M', version: 'Home', quantity: 1, price: 38000, image: 'https://placehold.co/600x800/74ACDF/FFFFFF?text=argentina-titular-2024' }],
    subtotal: 38000, discount: 3800, discountCode: 'CARPI10', total: 34200, paymentMethod: 'Stripe',
  },
  {
    id: '3', number: 'CC-003', createdAt: '2025-04-10T09:15:00Z', status: 'shipped',
    customer: { name: 'Lucas Ferreiro', email: 'lucas.ferreiro@hotmail.com', phone: '+54 11 5555-1234', address: 'San Martín 890', city: 'Lanús', state: 'Buenos Aires' },
    items: [
      { productId: '2', name: 'Camiseta Racing Club Alternativa 2024', team: 'Racing Club', size: 'XL', version: 'Away', quantity: 1, price: 35000, image: 'https://placehold.co/600x800/E3051B/FFFFFF?text=racing-alternativa-2024' },
      { productId: '1', name: 'Camiseta Racing Club Titular 2024', team: 'Racing Club', size: 'L', version: 'Home', quantity: 1, price: 35000, image: 'https://placehold.co/600x800/003087/FFFFFF?text=racing-titular-2024' },
    ],
    subtotal: 70000, discount: 10500, discountCode: 'RACING', total: 59500, paymentMethod: 'MercadoPago',
  },
  {
    id: '4', number: 'CC-004', createdAt: '2025-04-15T16:45:00Z', status: 'paid',
    customer: { name: 'Sofía Moreno', email: 'sofi.moreno@gmail.com', phone: '+54 351 888-9999', address: 'Obispo Trejo 456', city: 'Córdoba', state: 'Córdoba' },
    items: [{ productId: '4', name: 'Camiseta Argentina Tercera 2024', team: 'Selección Argentina', size: 'S', version: 'Third', quantity: 1, price: 38000, image: 'https://placehold.co/600x800/5B2D8E/FFFFFF?text=argentina-tercera-2024' }],
    subtotal: 38000, discount: 0, total: 38000, paymentMethod: 'Stripe',
  },
  {
    id: '5', number: 'CC-005', createdAt: '2025-04-20T11:00:00Z', status: 'pending',
    customer: { name: 'Tomás Ibáñez', email: 'tomas.i@gmail.com', phone: '+54 11 4444-7777', address: 'Rivadavia 2345', city: 'Buenos Aires', state: 'CABA' },
    items: [
      { productId: '5', name: 'Camiseta Real Madrid Titular 2024/25', team: 'Real Madrid', size: 'M', version: 'Home', quantity: 1, price: 40000, image: 'https://placehold.co/600x800/FFFFFF/003087?text=real-madrid-titular-2025' },
      { productId: '6', name: 'Camiseta Barcelona Titular 2024/25', team: 'FC Barcelona', size: 'M', version: 'Home', quantity: 1, price: 40000, image: 'https://placehold.co/600x800/A50044/FFFFFF?text=barcelona-titular-2025' },
    ],
    subtotal: 80000, discount: 16000, discountCode: 'CARPI20', total: 64000, paymentMethod: 'MercadoPago',
  },
  {
    id: '6', number: 'CC-006', createdAt: '2025-04-28T13:30:00Z', status: 'pending',
    customer: { name: 'Camila Ríos', email: 'cami.rios@gmail.com', phone: '+54 11 6666-3333', address: 'Arenales 789', city: 'Buenos Aires', state: 'CABA' },
    items: [{ productId: '7', name: 'Camiseta Manchester City Titular 2024/25', team: 'Manchester City', size: 'L', version: 'Home', quantity: 2, price: 40000, image: 'https://placehold.co/600x800/6CADDF/FFFFFF?text=manchester-city-titular-2025' }],
    subtotal: 80000, discount: 0, total: 80000, paymentMethod: 'Stripe',
  },
]

interface OrdersState {
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt' | 'status'>) => string
  updateStatus: (id: string, status: OrderStatus) => void
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      addOrder: (data) => {
        const id = String(Date.now())
        const n = get().orders.length + 1
        const number = `CC-${String(n).padStart(3, '0')}`
        const order: Order = { ...data, id, number, createdAt: new Date().toISOString(), status: 'pending' }
        set((s) => ({ orders: [order, ...s.orders] }))
        return id
      },
      updateStatus: (id, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
    }),
    { name: 'carpi-orders' }
  )
)
