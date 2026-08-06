// ============================================================
// ÍCONOS DISPONIBLES PARA CONTENIDO EDITABLE
// ============================================================
// Los bloques que se editan desde el panel guardan el NOMBRE del
// ícono como texto. Este registro traduce ese nombre a componente.
//
// Es una lista curada y no todo lucide-react a propósito: un import
// dinámico de la librería entera se lleva cientos de kilobytes al
// bundle del cliente, y el 99% nunca se usaría. Sumar un ícono es
// agregar una línea acá.
// ============================================================

import {
  Truck, Shield, Award, Headphones, RotateCcw, CheckCircle,
  CreditCard, Banknote, Package, Store, Star, Heart,
  Clock, MapPin, Phone, Mail, Gift, Tag,
  Percent, Lock, ThumbsUp, Zap, BadgeCheck, Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const CONTENT_ICONS = {
  Truck, Shield, Award, Headphones, RotateCcw, CheckCircle,
  CreditCard, Banknote, Package, Store, Star, Heart,
  Clock, MapPin, Phone, Mail, Gift, Tag,
  Percent, Lock, ThumbsUp, Zap, BadgeCheck, Sparkles,
} satisfies Record<string, LucideIcon>

export type ContentIconName = keyof typeof CONTENT_ICONS

/** Etiquetas en castellano para el selector del panel. */
export const ICON_LABELS: Record<ContentIconName, string> = {
  Truck: 'Camión / envío',
  Shield: 'Escudo / protección',
  Award: 'Premio / calidad',
  Headphones: 'Auriculares / soporte',
  RotateCcw: 'Flecha circular / devolución',
  CheckCircle: 'Tilde / confirmado',
  CreditCard: 'Tarjeta',
  Banknote: 'Billete / efectivo',
  Package: 'Paquete',
  Store: 'Local / sucursal',
  Star: 'Estrella',
  Heart: 'Corazón',
  Clock: 'Reloj / horario',
  MapPin: 'Ubicación',
  Phone: 'Teléfono',
  Mail: 'Correo',
  Gift: 'Regalo',
  Tag: 'Etiqueta / precio',
  Percent: 'Porcentaje / descuento',
  Lock: 'Candado / seguridad',
  ThumbsUp: 'Pulgar arriba',
  Zap: 'Rayo / rapidez',
  BadgeCheck: 'Insignia verificada',
  Sparkles: 'Destellos / novedad',
}

export const ICON_NAMES = Object.keys(CONTENT_ICONS) as ContentIconName[]

export function isContentIcon(value: unknown): value is ContentIconName {
  return typeof value === 'string' && value in CONTENT_ICONS
}

/**
 * Devuelve el componente del ícono, con reserva por si la base
 * tiene un nombre viejo que ya no está en el registro.
 */
export function iconFor(name: string | null | undefined): LucideIcon {
  return isContentIcon(name) ? CONTENT_ICONS[name] : CheckCircle
}
