// ============================================================
// FRONTEND TYPES (cart, UI state)
// ============================================================

/**
 * Talle. Es string y no una unión cerrada a propósito: además de
 * S/M/L/XL/XXL hay que poder cargar talles numéricos de camisetas
 * viejas (34, 36, 38...). La lista sugerida vive en SIZE_PRESETS.
 */
export type Size = string

/** Talles ofrecidos por defecto en el alta de producto. */
export const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL'] as const

export type JerseyVersion = 'Home' | 'Away' | 'Third'
export type BadgeType = 'New' | 'Sale' | 'Limited'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type DiscountType = 'percent' | 'fixed'

export interface Product {
  id: string
  slug: string
  name: string
  team: string
  league: string
  category: string          // category slug, e.g. 'equipos'
  categoryId: string | null // category UUID from DB
  garmentType: string       // 'Camisetas', 'Buzos', ... — ver lib/garments.ts
  price: number
  originalPrice?: number
  sizes: Size[]
  availableVersions: JerseyVersion[]
  images: string[]
  description: string
  features: string[]
  badge?: BadgeType
  inStock: boolean
  rating: number
  reviewCount: number
}

export interface CartItem {
  productId: string
  product: Product
  size: Size
  version: JerseyVersion
  quantity: number
}

export interface ProductCategory {
  id: string       // UUID from DB
  slug: string     // 'equipos', 'selecciones', etc.
  name: string
  description: string
  image: string
  count: number
  comingSoon?: boolean
  /** false = sigue existiendo con sus productos, pero no se muestra en la tienda */
  visible: boolean
  sortOrder: number
}

export interface CustomerReview {
  id: string
  name: string
  initials: string
  rating: number
  date: string
  text: string
  product: string
  verified: boolean
}

// ============================================================
// MULTI-TENANT TYPES
// ============================================================

export interface Tenant {
  id: string
  name: string
  slug: string
  owner_email: string | null
  created_at: string
}

/** Public store settings — safe to send to the browser. mp_access_token excluded. */
export interface StoreSettings {
  tenant_id: string
  store_name: string
  logo_url: string | null
  primary_color: string
  currency: string
  email_from: string | null
  mp_public_key: string | null
  hero_title: string
  hero_subtitle: string
  hero_cta: string
  hero_secondary: string
  carousel_images: string[]
  newsletter_title: string
  newsletter_subtitle: string
  footer_tagline: string
  footer_instagram: string | null
  footer_email: string | null
  order_prefix: string

  // ── Condiciones de pago ──
  /** Cuotas ofrecidas en MercadoPago (se envía como payment_methods.installments). */
  installments: number
  /** % off por pagar en efectivo o transferencia. */
  cash_discount_percent: number

  // ── Tarifas de envío (provisorias, hasta conectar Correo Argentino) ──
  ship_home_caba: number
  ship_branch_caba: number
  ship_home_rest: number
  ship_branch_rest: number
}

export interface TenantContextValue {
  tenant: Tenant
  settings: StoreSettings
}

// ============================================================
// DB-LAYER TYPES (what Supabase queries return)
// ============================================================

export interface DBProduct {
  id: string
  tenant_id: string
  slug: string
  name: string
  team: string
  league: string
  category_id: string | null
  garment_type: string | null
  price: number
  original_price: number | null
  sizes: string[]
  available_versions: string[]
  images: string[]
  description: string | null
  features: string[]
  badge: string | null
  in_stock: boolean
  rating: number
  review_count: number
  created_at: string
  updated_at: string
  categories?: { slug: string } | null
}

export interface DBCategory {
  id: string
  tenant_id: string
  slug: string
  name: string
  description: string | null
  image: string | null
  coming_soon: boolean
  visible: boolean
  sort_order: number
}

export interface DBOrder {
  id: string
  tenant_id: string
  number: string
  user_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  customer_city: string | null
  customer_state: string | null
  customer_zip: string | null
  customer_country: string | null
  subtotal: number
  discount: number
  discount_code: string | null
  total: number
  payment_method: string
  payment_id: string | null
  status: OrderStatus
  notes: string | null

  // ── Envío ──
  shipping_method: 'domicilio' | 'sucursal' | null
  shipping_zone: 'caba_gba' | 'resto' | null
  /** Congelado al crear el pedido: subir las tarifas no reescribe pedidos viejos. */
  shipping_cost: number
  tracking_number: string | null
  /** null = todavía no despachado. Es lo que define la cola de despacho. */
  shipped_at: string | null

  created_at: string
  updated_at: string
  order_items?: DBOrderItem[]
}

export interface DBOrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_team: string
  size: string
  version: string
  quantity: number
  price: number
  image: string | null
}

export interface DBCoupon {
  id: string
  tenant_id: string
  code: string
  type: DiscountType
  value: number
  active: boolean
  uses: number
  max_uses: number | null
  created_at: string
  updated_at: string
}

// ============================================================
// ADMIN MUTATION PAYLOADS
// (mirrored from lib/db/* — kept here so client components can
//  import the type without pulling in next/headers via lib/db)
// ============================================================

export interface ProductInsert {
  slug: string
  name: string
  team: string
  league: string
  category_id: string | null
  garment_type: string | null
  price: number
  original_price: number | null
  sizes: string[]
  available_versions: string[]
  images: string[]
  description: string
  features: string[]
  badge: string | null
  in_stock: boolean
}

export interface CategoryPayload {
  name: string
  slug?: string
  description?: string
  visible?: boolean
  sort_order?: number
}

export interface CouponInsert {
  code: string
  type: DiscountType
  value: number
  active?: boolean
  max_uses?: number | null
}

// ============================================================
// CHECKOUT / ORDER CREATION PAYLOAD
// ============================================================

/**
 * What the browser sends to POST /[tenant]/api/orders.
 * Contains NO prices — the server looks those up from the DB.
 * tenant_id is resolved server-side from the URL slug.
 */
export interface OrderRequest {
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: Array<{
    productId: string
    size: string
    version: string
    quantity: number
  }>
  paymentMethod: PaymentMethod
  discountCode: string | null
  /** Zona y modalidad; el costo lo resuelve el servidor desde store_settings. */
  shipping: {
    zone: 'caba_gba' | 'resto'
    method: 'domicilio' | 'sucursal'
  }
}

/** 'cash' cubre efectivo y transferencia — es el que accede al descuento. */
export type PaymentMethod = 'mercadopago' | 'card' | 'cash'

/**
 * Internal server-side payload passed to createOrder().
 * All financial values are computed server-side from DB-verified prices.
 */
export interface CreateOrderPayload {
  tenantId: string
  tenantSlug: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: Array<{
    productId: string
    productName: string
    productTeam: string
    size: string
    version: string
    quantity: number
    price: number
    image: string
  }>
  orderPrefix: string
  subtotal: number
  /** Descuento por cupón + descuento por efectivo, ya sumados. */
  discount: number
  discountCode: string | null
  shippingMethod: 'domicilio' | 'sucursal'
  shippingZone: 'caba_gba' | 'resto'
  shippingCost: number
  total: number
  paymentMethod: PaymentMethod
}
