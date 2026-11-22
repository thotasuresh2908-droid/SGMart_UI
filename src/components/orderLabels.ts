import type { OrderStatus, OrderView } from '../api/types'

/** What the shopper sees for each status (same words as the prototype). */
export const CUSTOMER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  PLACED: { label: 'Waiting for store', cls: 'new' },
  ACCEPTED: { label: 'Accepted', cls: 'acc' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'out' },
  DELIVERED: { label: 'Delivered', cls: 'done' },
  REJECTED: { label: 'Declined', cls: 'rej' },
  CANCELLED: { label: 'Cancelled', cls: 'rej' },
}

export const PAYMENT_METHOD_LABEL = { CASH_ON_DELIVERY: 'Cash on delivery', UPI_ON_DELIVERY: 'UPI on delivery' } as const

export const isActive = (o: OrderView) => o.status === 'PLACED' || o.status === 'ACCEPTED' || o.status === 'OUT_FOR_DELIVERY'
