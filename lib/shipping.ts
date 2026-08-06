// ============================================================
// ENVÍOS
// ============================================================
// Tarifas provisorias hasta conectar la cotización en vivo de
// Correo Argentino. Cuando eso pase, lo único que cambia es
// shippingCost(): el pedido, la cola de despacho y el tracking
// quedan igual porque ya guardan el costo congelado.
//
// Las cuatro tarifas viven en store_settings, así que se editan
// desde el panel sin tocar código.
// ============================================================

import type { StoreSettings } from '@/types'

export type ShippingZone = 'caba_gba' | 'resto'
export type ShippingMethod = 'domicilio' | 'sucursal'

export const SHIPPING_ZONES: ShippingZone[] = ['caba_gba', 'resto']
export const SHIPPING_METHODS: ShippingMethod[] = ['domicilio', 'sucursal']

export const ZONE_LABELS: Record<ShippingZone, string> = {
  caba_gba: 'Capital Federal y GBA',
  resto: 'Resto del país',
}

export const METHOD_LABELS: Record<ShippingMethod, string> = {
  domicilio: 'Envío a domicilio',
  sucursal: 'Retiro en sucursal de Correo',
}

export const METHOD_HINTS: Record<ShippingMethod, string> = {
  domicilio: 'Te lo llevamos a la dirección que cargues.',
  sucursal: 'Lo retirás en la sucursal de Correo Argentino más cercana. Sale más barato.',
}

export function isShippingZone(v: unknown): v is ShippingZone {
  return v === 'caba_gba' || v === 'resto'
}

export function isShippingMethod(v: unknown): v is ShippingMethod {
  return v === 'domicilio' || v === 'sucursal'
}

/**
 * Costo de envío para una combinación zona × modalidad.
 * Siempre se resuelve en el servidor a partir de store_settings:
 * el navegador manda zona y modalidad, nunca el precio.
 */
export function shippingCost(
  settings: StoreSettings,
  zone: ShippingZone,
  method: ShippingMethod
): number {
  const rates: Record<ShippingZone, Record<ShippingMethod, number>> = {
    caba_gba: {
      domicilio: Number(settings.ship_home_caba),
      sucursal: Number(settings.ship_branch_caba),
    },
    resto: {
      domicilio: Number(settings.ship_home_rest),
      sucursal: Number(settings.ship_branch_rest),
    },
  }
  return rates[zone][method]
}

/** Las cuatro tarifas juntas — para pintar la grilla del checkout. */
export function shippingMatrix(settings: StoreSettings) {
  return SHIPPING_ZONES.map((zone) => ({
    zone,
    label: ZONE_LABELS[zone],
    options: SHIPPING_METHODS.map((method) => ({
      method,
      label: METHOD_LABELS[method],
      cost: shippingCost(settings, zone, method),
    })),
  }))
}
