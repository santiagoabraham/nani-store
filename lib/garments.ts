// ============================================================
// TIPOS DE PRENDA
// ============================================================
// Dimensión independiente de la categoría: una camiseta y un
// buzo pueden ser los dos de la categoría "Equipos".
//
// Se valida acá y no con un CHECK en la base, así sumar un tipo
// nuevo es cambiar esta lista y nada más.
// ============================================================

export const GARMENT_TYPES = [
  'Camisetas',
  'Buzos',
  'Musculosas',
  'Shorts',
  'Remeras',
  'Accesorios',
] as const

export type GarmentType = (typeof GARMENT_TYPES)[number]

export function isGarmentType(value: unknown): value is GarmentType {
  return typeof value === 'string' && (GARMENT_TYPES as readonly string[]).includes(value)
}
