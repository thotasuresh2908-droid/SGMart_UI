import { describe, expect, it } from 'vitest'
import { discountPercent, pricePreview, validateProduct, type ProductValues } from './productRules'

const ok: ProductValues = { name: 'Curd', categoryId: '2', unit: '400 g', price: '35', mrp: '40', stockQty: '20', icon: '🥛' }

describe('product rules (same as the backend)', () => {
  it('accepts a normal product', () => expect(validateProduct(ok, true)).toEqual({}))

  it('gives clear messages', () => {
    expect(validateProduct({ ...ok, name: 'C', categoryId: '', unit: '', price: '0', stockQty: '-1' }, true)).toEqual({
      name: 'Enter the product name.', categoryId: 'Choose a category.', unit: 'Enter the pack size, like 500 g or 1 L.',
      price: 'Enter a price above ₹0.', stockQty: 'Enter how many are in stock (0 or more).',
    })
    expect(validateProduct({ ...ok, mrp: '30' }, true).mrp).toBe('MRP can’t be lower than the selling price.')
    expect(validateProduct({ ...ok, mrp: '' }, true)).toEqual({})
  })

  it('discount and preview match the prototype', () => {
    expect(discountPercent(48, 60)).toBe(20)
    expect(discountPercent(140, 165)).toBe(15)
    expect(discountPercent(28, 28)).toBeNull()
    expect(pricePreview('130', '165', 140)).toEqual({ price: '₹130', mrp: '₹165', off: 21, change: 'Down ₹10 from ₹140' })
    expect(pricePreview('', '', 140)).toBeNull()
  })
})
