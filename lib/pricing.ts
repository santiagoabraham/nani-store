// ============================================================
// CONDICIONES DE PAGO
// ============================================================
// Un solo lugar donde se derivan los dos precios que ve el
// comprador, para que la ficha de producto, el checkout y el
// servidor no puedan discrepar.
//
// El precio de lista (products.price) es el precio en cuotas:
// "3 cuotas sin interés" significa que no hay recargo, así que
// el total financiado es igual al de lista.
// ============================================================

import type { StoreSettings } from '@/types'

export interface PaymentTerms {
  /** Cuotas ofrecidas en MercadoPago. */
  installments: number
  /** % off por pagar en efectivo o transferencia. */
  cashDiscountPercent: number
}

export function paymentTerms(settings: StoreSettings): PaymentTerms {
  return {
    installments: settings.installments,
    cashDiscountPercent: Number(settings.cash_discount_percent),
  }
}

/**
 * Precio pagando en efectivo o por transferencia.
 * Se redondea al peso: no tiene sentido cobrar centavos en ARS.
 */
export function cashPrice(listPrice: number, cashDiscountPercent: number): number {
  return Math.round(listPrice * (1 - cashDiscountPercent / 100))
}

/** Monto de cada cuota. Redondeado al peso, igual que arriba. */
export function installmentAmount(listPrice: number, installments: number): number {
  if (installments <= 1) return Math.round(listPrice)
  return Math.round(listPrice / installments)
}

/**
 * Descuento en pesos por pagar en efectivo, sobre un total ya
 * neteado de cupones. Se calcula sobre el subtotal menos el
 * descuento del cupón para que los dos beneficios no se pisen
 * ni se apliquen dos veces sobre la misma base.
 */
export function cashDiscountAmount(
  baseAmount: number,
  cashDiscountPercent: number
): number {
  return Math.round(baseAmount * (cashDiscountPercent / 100))
}

/** true si el medio de pago accede al descuento por efectivo. */
export function qualifiesForCashDiscount(paymentMethod: string): boolean {
  return paymentMethod === 'cash'
}
