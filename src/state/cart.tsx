import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ShopProduct } from '../api/types'
import { readJson, writeJson } from '../lib/storage'
import { addOne, itemCount, itemTotal, lines, removeOne, type Cart, type CartLine } from './cartLogic'
import { useToast } from './toast'

interface CartApi {
  lines: CartLine[]
  count: number
  total: number
  qtyOf: (productId: number) => number
  add: (product: ShopProduct) => void
  remove: (productId: number) => void
  replace: (cart: Cart) => void
  clear: () => void
  cart: Cart
}

const KEY = 'sgmart.cart'
const CartContext = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [cart, setCart] = useState<Cart>(() => readJson<Cart>(KEY, {}))

  useEffect(() => writeJson(KEY, cart), [cart])

  const add = useCallback(
    (product: ShopProduct) => {
      const change = addOne(cart, product)
      if (!change.ok) toast(change.message)
      setCart(change.cart)
    },
    [cart, toast],
  )

  const value = useMemo<CartApi>(
    () => ({
      cart,
      lines: lines(cart),
      count: itemCount(cart),
      total: itemTotal(cart),
      qtyOf: (id) => cart[id]?.qty ?? 0,
      add,
      remove: (id) => setCart((c) => removeOne(c, id)),
      replace: setCart,
      clear: () => setCart({}),
    }),
    [cart, add],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
