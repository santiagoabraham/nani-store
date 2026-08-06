'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_EVENTS = 10_000

export type EventName =
  | 'session_start'
  | 'page_view'
  | 'product_viewed'
  | 'product_added_to_cart'
  | 'product_quick_added'
  | 'cart_opened'
  | 'coupon_applied'
  | 'coupon_failed'
  | 'checkout_started'
  | 'payment_method_selected'
  | 'order_completed'
  | 'category_clicked'
  | 'scroll_depth'
  | 'time_on_page'

export interface AnalyticsEvent {
  id: string
  event_type: EventName
  timestamp: string   // ISO 8601
  session_id: string
  metadata: Record<string, unknown>
}

interface AnalyticsStore {
  events: AnalyticsEvent[]
  addEvent: (event: AnalyticsEvent) => void
  addEvents: (events: AnalyticsEvent[]) => void
  clearEvents: () => void
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (event) =>
        set((s) => {
          const next = [...s.events, event]
          return { events: next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next }
        }),

      addEvents: (batch) =>
        set((s) => {
          const next = [...s.events, ...batch]
          return { events: next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next }
        }),

      clearEvents: () => set({ events: [] }),
    }),
    { name: 'carpi-analytics' }
  )
)
