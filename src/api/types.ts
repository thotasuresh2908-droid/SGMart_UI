/* Types that mirror the backend DTOs (Spring Boot sgmart-api). Money arrives as numbers in rupees. */

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface StoreInfo {
  storeName: string
  phone: string
  opensAt: string
  closesAt: string
  openNow: boolean
  etaMinutes: number
  deliveryFee: number
  freeDeliveryMin: number
  firstOrderCodLimit: number | null
}

export interface Category {
  id: number
  name: string
  icon: string
}

export interface ShopProduct {
  id: number
  categoryId: number
  name: string
  unit: string
  price: number
  mrp: number
  discountPercent: number | null
  stockLeft: number
  lowStock: boolean
  icon: string
  imageUrl: string | null
}

export type AdminRole = 'OWNER' | 'MANAGER'

export interface SessionInfo {
  type: 'GUEST' | 'CUSTOMER' | 'ADMIN'
  id: number | null
  name: string | null
  email: string | null
  role: AdminRole | null
}

export interface CustomerProfile {
  id: number
  name: string
  email: string | null
  mobile: string | null
  mobileVerified: boolean
  deliveredOrders: number
}

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'REJECTED' | 'CANCELLED'
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'UPI_ON_DELIVERY'
export type PaymentMode = 'CASH' | 'UPI'
export type OrderItemStatus = 'ACTIVE' | 'REMOVED_BY_CUSTOMER' | 'NOT_AVAILABLE'
export type OrderEventType =
  | 'PLACED' | 'EDITED' | 'CANCELLED' | 'CUSTOMER_VERIFIED' | 'ITEM_UNAVAILABLE' | 'ACCEPTED'
  | 'REJECTED' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'PAYMENT_CONFIRMED' | 'DELIVERED'
export type VehicleType = 'BIKE' | 'SCOOTER' | 'BICYCLE'

export interface OrderItemView {
  id: number
  productId: number
  name: string
  unit: string
  icon: string
  imageUrl: string | null
  unitPrice: number
  qty: number
  lineTotal: number
  status: OrderItemStatus
  unavailableReason: string | null
}

export interface OrderUpdate {
  at: string
  by: string
  type: OrderEventType
  message: string | null
}

export interface PartnerInfo {
  id: number
  name: string
  mobile: string
  vehicleType: VehicleType
}

export interface PaymentInfo {
  method: PaymentMode
  amount: number
  paidByName: string
  collectedBy: string
  upiRef: string | null
  confirmedBy: string
  confirmedAt: string
}

export interface OrderView {
  orderNo: string
  status: OrderStatus
  placedAt: string
  etaAt: string
  acceptedAt: string | null
  outForDeliveryAt: string | null
  deliveredAt: string | null
  rejectedAt: string | null
  cancelledAt: string | null
  customerName: string
  customerMobile: string
  addressLine: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  paymentMethod: PaymentMethod
  itemTotal: number
  deliveryFee: number
  total: number
  itemCount: number
  items: OrderItemView[]
  updates: OrderUpdate[]
  canEdit: boolean
  canCancel: boolean
  rejectReason: string | null
  cancelReason: string | null
  storePhone: string
  deliveryPartner: PartnerInfo | null
  payment: PaymentInfo | null
}

export interface ItemRequest {
  productId: number
  qty: number
}

export interface PlaceOrderRequest {
  customerName: string
  mobile: string
  addressLine: string
  landmark?: string
  latitude?: number | null
  longitude?: number | null
  paymentMethod: PaymentMethod
  items: ItemRequest[]
  captchaToken?: string | null
}

export interface PlacedOrder {
  orderNo: string
  trackingToken: string
  order: OrderView
}

export interface ClaimResult {
  linked: number
  skipped: number
}

/** What arrives over the WebSocket; the app then re-fetches through the API. */
export interface LiveOrderMessage {
  orderNo: string
  status: OrderStatus
  change: OrderEventType
  at: string
}

/* ------------------------------------------------ admin */

export interface AdminUserView {
  id: number
  email: string
  name: string
  role: AdminRole
  active: boolean
  lastLoginAt: string | null
}

/** The customer badge on an admin order card. */
export interface CustomerAdminView {
  id: number
  name: string
  mobile: string | null
  email: string | null
  newCustomer: boolean
  mobileVerified: boolean
  deliveredOrders: number
  blocked: boolean
  blockedReason: string | null
  blockedAt: string | null
}

export interface AdminOrderView {
  order: OrderView
  customer: CustomerAdminView | null
}

export interface OrderCounts {
  newOrders: number
  accepted: number
  outForDelivery: number
  deliveredToday: number
  deliveredSalesToday: number
  rejectedToday: number
  cancelledToday: number
}

export type PartnerStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'OFF_DUTY'

export interface PartnerView {
  id: number
  name: string
  mobile: string
  vehicleType: VehicleType
  status: PartnerStatus
  active: boolean
  deliveriesToday: number
  deliveriesTotal: number
  currentOrders: string[]
}

export interface UnavailableItem {
  itemId: number
  reason: string
}

export interface DeliverRequest {
  method: PaymentMode
  paidByName: string
  collectedByPartnerId: number
  upiRef?: string | null
}
