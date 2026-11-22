import type { OrderStatus, VehicleType } from '../api/types'

/** What admins see for each status (same words as the prototype). */
export const ADMIN_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  PLACED: { label: 'New order', cls: 'new' },
  ACCEPTED: { label: 'Accepted', cls: 'acc' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'out' },
  DELIVERED: { label: 'Delivered', cls: 'done' },
  REJECTED: { label: 'Rejected', cls: 'rej' },
  CANCELLED: { label: 'Cancelled by customer', cls: 'rej' },
}

export const STATUS_FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'PLACED', label: 'New' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

/** Why an item can't be supplied (shown to the customer). */
export const UNAVAILABLE_REASONS = ['Out of stock', 'Not enough quantity', 'Damaged or poor quality', 'Expired']

/** Why a whole order is rejected (shown to the customer). */
export const REJECT_REASONS = [
  'Some items are out of stock',
  'Address is outside our delivery area',
  'Store is closing for the day',
  'Unable to reach the customer',
]

export const VEHICLE: Record<VehicleType, string> = { BIKE: 'Bike', SCOOTER: 'Scooter', BICYCLE: 'Bicycle' }
