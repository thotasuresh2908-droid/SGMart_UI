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

/* ------------------------------------------------ admin: products and stock */

export type StockStatus = 'IN_SHOP' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'HIDDEN'
export type StockReason =
  | 'RECEIVED' | 'SHELF_COUNT' | 'DAMAGED' | 'CORRECTION' | 'NEW_PRODUCT'
  | 'ORDER_PLACED' | 'ORDER_EDITED' | 'ITEM_UNAVAILABLE' | 'ORDER_CANCELLED' | 'ORDER_REJECTED'

export interface AdminProduct {
  id: number
  categoryId: number
  categoryName: string
  name: string
  unit: string
  price: number
  mrp: number
  discountPercent: number | null
  stockQty: number
  status: StockStatus
  active: boolean
  icon: string
  imageUrl: string | null
  updatedAt: string
}

export interface ProductRequest {
  name: string
  categoryId: number
  unit: string
  price: number
  mrp: number | null
  icon: string
}

export interface CreateProductRequest extends ProductRequest {
  stockQty: number
}

export interface UpdateProductRequest extends ProductRequest {
  active: boolean
}

export interface StockUpdateRequest {
  mode: 'ADD' | 'SET'
  qty: number
  reason?: 'SHELF_COUNT' | 'DAMAGED' | 'CORRECTION'
}

export interface StockChangeResult {
  productId: number
  productName: string
  stockBefore: number
  stockAfter: number
  changed: boolean
  status: StockStatus
}

export interface StockReport {
  date: string
  summary: {
    productsInShop: number
    liveProducts: number
    unitsAvailable: number
    unitsAdded: number
    productsRestocked: number
    unitsDelivered: number
    ordersDelivered: number
    outOfStock: number
    lowStock: number
  }
  products: {
    productId: number
    name: string
    unit: string
    icon: string
    imageUrl: string | null
    startOfDay: number
    added: number
    removed: number
    ordered: number
    delivered: number
    available: number
    status: StockStatus
  }[]
  restockLog: {
    at: string
    productId: number
    name: string
    unit: string
    icon: string
    imageUrl: string | null
    change: number
    stockAfter: number
    reason: StockReason
    note: string | null
    addedBy: string
  }[]
  partners: {
    partnerId: number
    name: string
    mobile: string
    vehicleType: VehicleType
    deliveries: number
    units: number
    amount: number
  }[]
  deliveries: {
    deliveredAt: string
    orderNo: string
    customerName: string
    customerMobile: string
    units: number
    items: string | null
    partnerId: number | null
    partnerName: string | null
    partnerMobile: string | null
    minutesTaken: number
    amount: number
  }[]
}

/* ------------------------------------------------ admin: payments */

export interface DueOrder {
  orderNo: string
  customerName: string
  customerMobile: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  amountDue: number
  partnerId: number | null
  partnerName: string | null
  partnerMobile: string | null
}

export interface PaymentReport {
  date: string | null
  totals: {
    payments: number
    collected: number
    cash: number
    upi: number
    averageBill: number | null
    stillToCollect: number
    activeOrders: number
  }
  byPartner: {
    partnerId: number
    name: string
    mobile: string
    vehicleType: VehicleType
    status: PartnerStatus
    deliveries: number
    cashToHandOver: number
    upi: number
    onTheWay: DueOrder[]
  }[]
  stillToCollect: DueOrder[]
  records: {
    at: string
    orderNo: string
    paidBy: string
    method: PaymentMode
    upiRef: string | null
    amount: number
    collectedBy: string
    confirmedBy: string
  }[]
}

/* ------------------------------------------------ admin: partners, settings, users */

export interface PartnerRequest {
  name: string
  mobile: string
  vehicleType: VehicleType
}

export interface UpdateStoreRequest {
  storeName: string
  phone: string
  opensAt: string
  closesAt: string
  etaMinutes: number
  deliveryFee: number
  freeDeliveryMin: number
  firstOrderCodLimit: number | null
}
