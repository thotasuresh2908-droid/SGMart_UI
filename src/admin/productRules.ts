import { money } from '../lib/format'

export const ICONS = ['🥦', '🍎', '🍌', '🍅', '🥕', '🧅', '🥔', '🍇', '🥭', '🍋', '🥒', '🌽', '🥛', '🧀', '🍞', '🥚', '🧈',
  '🍿', '🍪', '🥜', '🍫', '🥤', '☕', '🍵', '🧃', '🌾', '🫘', '🛢️', '🧂', '🍯', '🧼', '🪥', '🧴', '🧻', '🛒']

export interface ProductValues {
  name: string
  categoryId: string
  unit: string
  price: string
  mrp: string
  stockQty: string
  icon: string
}

export type ProductErrors = Partial<Record<keyof ProductValues, string>>

const MONEY = /^\d{1,8}(\.\d{1,2})?$/

/** Same rules and messages as the backend's product requests. */
export function validateProduct(v: ProductValues, withStock: boolean): ProductErrors {
  const e: ProductErrors = {}
  if (v.name.trim().length < 2) e.name = 'Enter the product name.'
  else if (v.name.trim().length > 120) e.name = 'Keep the name under 120 characters.'
  if (!v.categoryId) e.categoryId = 'Choose a category.'
  if (!v.unit.trim()) e.unit = 'Enter the pack size, like 500 g or 1 L.'
  else if (v.unit.trim().length > 40) e.unit = 'Keep the pack size under 40 characters.'
  if (!MONEY.test(v.price.trim()) || Number(v.price) <= 0) e.price = 'Enter a price above ₹0.'
  if (v.mrp.trim()) {
    if (!MONEY.test(v.mrp.trim()) || Number(v.mrp) <= 0) e.mrp = 'Enter an MRP above ₹0, or leave it empty.'
    else if (!e.price && Number(v.mrp) < Number(v.price)) e.mrp = 'MRP can’t be lower than the selling price.'
  }
  if (withStock && (!/^\d+$/.test(v.stockQty.trim()) || Number(v.stockQty) > 100000)) {
    e.stockQty = 'Enter how many are in stock (0 or more).'
  }
  return e
}

/** "15% off", rounded like the backend. Null when there is no discount. */
export function discountPercent(price: number, mrp: number | null): number | null {
  if (!mrp || mrp <= price) return null
  return Math.round(((mrp - price) * 100) / mrp)
}

/** The live preview under the price boxes. */
export function pricePreview(priceText: string, mrpText: string, oldPrice?: number) {
  const price = Number(priceText)
  if (!priceText.trim() || !(price > 0)) return null
  const mrp = mrpText.trim() ? Number(mrpText) : null
  const off = discountPercent(price, mrp)
  const change = oldPrice != null && price !== oldPrice
    ? `${price > oldPrice ? 'Up' : 'Down'} ${money(Math.abs(price - oldPrice))} from ${money(oldPrice)}`
    : null
  return { price: money(price), mrp: off && mrp ? money(mrp) : null, off, change }
}
