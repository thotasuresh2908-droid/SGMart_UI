import type { ShopProduct, StoreInfo } from '../api/types'

/**
 * The cart is kept in the browser (guests and signed-in shoppers alike). Prices here are
 * for display only: the backend re-reads every price and stock level when the order is placed.
 */
export interface CartLine {
  product: ShopProduct
  qty: number
}

export type Cart = Record<number, CartLine>

export type CartChange =
  | { ok: true; cart: Cart }
  | { ok: false; cart: Cart; message: string }

export function addOne(cart: Cart, product: ShopProduct): CartChange {
  const current = cart[product.id]?.qty ?? 0
  if (current + 1 > product.stockLeft) {
    return { ok: false, cart, message: `Only ${product.stockLeft} ${product.name} in stock` }
  }
  return { ok: true, cart: { ...cart, [product.id]: { product, qty: current + 1 } } }
}

export function removeOne(cart: Cart, productId: number): Cart {
  const line = cart[productId]
  if (!line) return cart
  const next = { ...cart }
  if (line.qty <= 1) delete next[productId]
  else next[productId] = { ...line, qty: line.qty - 1 }
  return next
}

export function lines(cart: Cart): CartLine[] {
  return Object.values(cart).filter((l) => l.qty > 0)
}

export function itemCount(cart: Cart): number {
  return lines(cart).reduce((n, l) => n + l.qty, 0)
}

export function itemTotal(cart: Cart): number {
  return Math.round(lines(cart).reduce((t, l) => t + l.product.price * l.qty, 0) * 100) / 100
}

/** Same rule as the backend: free for an empty cart or at/above the free-delivery amount. */
export function deliveryFee(total: number, store: Pick<StoreInfo, 'deliveryFee' | 'freeDeliveryMin'> | undefined): number {
  if (!store || total <= 0 || total >= store.freeDeliveryMin) return 0
  return store.deliveryFee
}

/** Updates product details (price, stock) from fresh shop data; drops products no longer for sale. */
export function refresh(cart: Cart, fresh: ShopProduct[]): Cart {
  const byId = new Map(fresh.map((p) => [p.id, p]))
  const next: Cart = {}
  for (const line of lines(cart)) {
    const p = byId.get(line.product.id)
    if (!p) {
      next[line.product.id] = line
      continue
    }
    const qty = Math.min(line.qty, p.stockLeft)
    if (qty > 0) next[p.id] = { product: p, qty }
  }
  return next
}
