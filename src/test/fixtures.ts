import type { OrderView, ShopProduct, StoreInfo } from '../api/types'

export const store: StoreInfo = {
  storeName: 'SGMart', phone: '9000012345', opensAt: '07:00:00', closesAt: '23:00:00', openNow: true,
  etaMinutes: 10, deliveryFee: 25, freeDeliveryMin: 199, firstOrderCodLimit: 1000,
}

export function product(over: Partial<ShopProduct> = {}): ShopProduct {
  return {
    id: 7, categoryId: 2, name: 'Toned Milk', unit: '500 ml', price: 28, mrp: 28, discountPercent: null,
    stockLeft: 80, lowStock: false, icon: '🥛', imageUrl: null, ...over,
  }
}

export function order(over: Partial<OrderView> = {}): OrderView {
  return {
    orderNo: 'SG1001', status: 'PLACED', placedAt: '2026-11-12T03:00:00Z', etaAt: '2026-11-12T03:10:00Z',
    acceptedAt: null, outForDeliveryAt: null, deliveredAt: null, rejectedAt: null, cancelledAt: null,
    customerName: 'Priya Sharma', customerMobile: '9876543210', addressLine: 'Flat 302, Green Residency, Road No. 12',
    landmark: null, latitude: null, longitude: null, paymentMethod: 'CASH_ON_DELIVERY', itemTotal: 101,
    deliveryFee: 25, total: 126, itemCount: 3,
    items: [
      { id: 11, productId: 7, name: 'Toned Milk', unit: '500 ml', icon: '🥛', imageUrl: null, unitPrice: 28, qty: 2, lineTotal: 56, status: 'ACTIVE', unavailableReason: null },
      { id: 12, productId: 8, name: 'Whole Wheat Bread', unit: '400 g', icon: '🍞', imageUrl: null, unitPrice: 45, qty: 1, lineTotal: 45, status: 'ACTIVE', unavailableReason: null },
    ],
    updates: [], canEdit: true, canCancel: true, rejectReason: null, cancelReason: null, storePhone: '9000012345',
    deliveryPartner: null, payment: null, ...over,
  }
}

import type { AdminOrderView, CustomerAdminView, PartnerView } from '../api/types'

export function customer(over: Partial<CustomerAdminView> = {}): CustomerAdminView {
  return {
    id: 9, name: 'Priya Sharma', mobile: '9876543210', email: null, newCustomer: false, mobileVerified: true,
    deliveredOrders: 2, blocked: false, blockedReason: null, blockedAt: null, ...over,
  }
}

/** SG1001: 2 × Toned Milk ₹56, 1 × Bread ₹45, 1 × Green Tea ₹140 = ₹241 with free delivery. */
export function adminOrder(over: Partial<AdminOrderView['order']> = {}, cust: Partial<CustomerAdminView> = {}): AdminOrderView {
  const base = order()
  return {
    order: {
      ...base,
      itemTotal: 241, deliveryFee: 0, total: 241, itemCount: 4,
      items: [
        ...base.items,
        { id: 13, productId: 9, name: 'Green Tea', unit: '25 bags', icon: '🍵', imageUrl: null, unitPrice: 140, qty: 1, lineTotal: 140, status: 'ACTIVE', unavailableReason: null },
      ],
      ...over,
    },
    customer: customer(cust),
  }
}

export const partners: PartnerView[] = [
  { id: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE', status: 'AVAILABLE', active: true, deliveriesToday: 2, deliveriesTotal: 3, currentOrders: [] },
  { id: 2, name: 'Salma Begum', mobile: '9949023456', vehicleType: 'SCOOTER', status: 'ON_DELIVERY', active: true, deliveriesToday: 1, deliveriesTotal: 1, currentOrders: ['SG1004'] },
  { id: 3, name: 'Arjun Reddy', mobile: '9000034567', vehicleType: 'BICYCLE', status: 'OFF_DUTY', active: true, deliveriesToday: 0, deliveriesTotal: 0, currentOrders: [] },
]

import type { AdminProduct, PaymentReport, StockReport } from '../api/types'

export function adminProduct(over: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: 9, categoryId: 4, categoryName: 'Tea, coffee & drinks', name: 'Green Tea', unit: '25 bags', price: 140, mrp: 165,
    discountPercent: 15, stockQty: 3, status: 'LOW_STOCK', active: true, icon: '🍵', imageUrl: null, updatedAt: '2026-11-12T03:00:00Z', ...over,
  }
}

export const categories = [
  { id: 2, name: 'Dairy, bread & eggs', icon: '🥛' },
  { id: 4, name: 'Tea, coffee & drinks', icon: '☕' },
]

export const stockReport: StockReport = {
  date: '2026-11-12',
  summary: { productsInShop: 20, liveProducts: 21, unitsAvailable: 640, unitsAdded: 30, productsRestocked: 2, unitsDelivered: 9, ordersDelivered: 3, outOfStock: 1, lowStock: 1 },
  products: [
    { productId: 12, name: 'Fresh Paneer', unit: '200 g', icon: '🧀', imageUrl: null, startOfDay: 2, added: 0, removed: 2, ordered: 0, delivered: 0, available: 0, status: 'OUT_OF_STOCK' },
    { productId: 9, name: 'Green Tea', unit: '25 bags', icon: '🍵', imageUrl: null, startOfDay: 3, added: 0, removed: 0, ordered: 0, delivered: 0, available: 3, status: 'LOW_STOCK' },
    { productId: 7, name: 'Toned Milk', unit: '500 ml', icon: '🥛', imageUrl: null, startOfDay: 110, added: 10, removed: 0, ordered: 5, delivered: 2, available: 115, status: 'IN_SHOP' },
  ],
  restockLog: [{ at: '2026-11-12T03:00:00Z', productId: 7, name: 'Toned Milk', unit: '500 ml', icon: '🥛', imageUrl: null, change: 10, stockAfter: 120, reason: 'RECEIVED', note: 'Stock received', addedBy: 'Store Owner' }],
  partners: [{ partnerId: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE', deliveries: 2, units: 7, amount: 434 }],
  deliveries: [{ deliveredAt: '2026-11-12T03:09:00Z', orderNo: 'SG1001', customerName: 'Mohammed Irfan', customerMobile: '9701234567', units: 5, items: 'Basmati Rice ×2, Toned Milk ×3', partnerId: 1, partnerName: 'Ravi Kumar', partnerMobile: '9848012345', minutesTaken: 11, amount: 308 }],
}

export const paymentReport: PaymentReport = {
  date: '2026-11-12',
  totals: { payments: 3, collected: 543, cash: 235, upi: 308, averageBill: 181, stillToCollect: 275, activeOrders: 2 },
  byPartner: [
    { partnerId: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE', status: 'AVAILABLE', deliveries: 2, cashToHandOver: 126, upi: 308, onTheWay: [] },
    { partnerId: 2, name: 'Salma Begum', mobile: '9949023456', vehicleType: 'SCOOTER', status: 'ON_DELIVERY', deliveries: 1, cashToHandOver: 109, upi: 0,
      onTheWay: [{ orderNo: 'SG1004', customerName: 'Kiran', customerMobile: '9000000003', status: 'OUT_FOR_DELIVERY', paymentMethod: 'UPI_ON_DELIVERY', amountDue: 200, partnerId: 2, partnerName: 'Salma Begum', partnerMobile: '9949023456' }] },
  ],
  stillToCollect: [
    { orderNo: 'SG1004', customerName: 'Kiran', customerMobile: '9000000003', status: 'OUT_FOR_DELIVERY', paymentMethod: 'UPI_ON_DELIVERY', amountDue: 200, partnerId: 2, partnerName: 'Salma Begum', partnerMobile: '9949023456' },
    { orderNo: 'SG1005', customerName: 'Latha', customerMobile: '9000000004', status: 'ACCEPTED', paymentMethod: 'CASH_ON_DELIVERY', amountDue: 75, partnerId: null, partnerName: null, partnerMobile: null },
  ],
  records: [{ at: '2026-11-12T03:09:00Z', orderNo: 'SG1001', paidBy: 'Mohammed Irfan', method: 'UPI', upiRef: '4821 9930 7712', amount: 308, collectedBy: 'Ravi Kumar', confirmedBy: 'Store Owner' }],
}
