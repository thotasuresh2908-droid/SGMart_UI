import { readJson, writeJson } from './storage'

/**
 * Guest orders placed in this browser. The backend returns a tracking token at checkout;
 * keeping it here lets a guest see "My orders", edit or cancel, and get live updates
 * without an account. Only the token's hash is stored on the server.
 */
export interface SavedOrder {
  orderNo: string
  token: string
  placedAt: string
}

const KEY = 'sgmart.orders'
const MAX = 50

export function savedOrders(): SavedOrder[] {
  const list = readJson<SavedOrder[]>(KEY, [])
  return Array.isArray(list) ? list.filter((o) => o && o.orderNo && o.token) : []
}

export function saveOrder(order: SavedOrder): void {
  const others = savedOrders().filter((o) => o.orderNo !== order.orderNo)
  writeJson(KEY, [order, ...others].slice(0, MAX))
}

export function tokenFor(orderNo: string): string | null {
  return savedOrders().find((o) => o.orderNo === orderNo)?.token ?? null
}

export function savedTokens(): string[] {
  return savedOrders().map((o) => o.token)
}
