import { describe, expect, it } from 'vitest'
import { product, store } from '../test/fixtures'
import { addOne, deliveryFee, itemCount, itemTotal, refresh, removeOne, type Cart } from './cartLogic'

describe('cart', () => {
  it('adds, counts and totals like the prototype', () => {
    let cart: Cart = {}
    const milk = product()
    const bread = product({ id: 8, name: 'Whole Wheat Bread', price: 45 })
    cart = (addOne(cart, milk) as { cart: Cart }).cart
    cart = (addOne(cart, milk) as { cart: Cart }).cart
    cart = (addOne(cart, bread) as { cart: Cart }).cart
    expect(itemCount(cart)).toBe(3)
    expect(itemTotal(cart)).toBe(101)
    cart = removeOne(cart, 7)
    cart = removeOne(cart, 7)
    expect(cart[7]).toBeUndefined()
  })

  it("won't add more than the shop has", () => {
    const tea = product({ id: 9, name: 'Green Tea', stockLeft: 1 })
    const first = addOne({}, tea)
    const second = addOne(first.cart, tea)
    expect(second.ok).toBe(false)
    expect(second.ok ? '' : second.message).toBe('Only 1 Green Tea in stock')
  })

  it('charges the delivery fee below the free-delivery amount only', () => {
    expect(deliveryFee(150, store)).toBe(25)
    expect(deliveryFee(199, store)).toBe(0)
    expect(deliveryFee(0, store)).toBe(0)
  })

  it('updates prices and trims quantities to fresh stock', () => {
    const cart: Cart = { 7: { product: product(), qty: 5 } }
    const next = refresh(cart, [product({ price: 30, stockLeft: 3 })])
    expect(next[7].qty).toBe(3)
    expect(next[7].product.price).toBe(30)
    expect(refresh(cart, [product({ stockLeft: 0 })])[7]).toBeUndefined()
  })
})
