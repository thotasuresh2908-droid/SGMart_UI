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
