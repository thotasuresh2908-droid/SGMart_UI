import { money } from '../lib/format'
import { useCart } from '../state/cart'
import { useUi } from '../state/ui'

/** Sticky "View cart" bar on phones, shown once something is in the cart. */
export function CartBar() {
  const cart = useCart()
  const ui = useUi()
  if (cart.count === 0 || ui.panel === 'cart' || ui.panel === 'checkout') return null
  return (
    <div className="cartbar show">
      <button type="button" onClick={() => ui.open('cart')}>
        <span>
          {cart.count} item{cart.count > 1 ? 's' : ''}
          <small>{money(cart.total)}</small>
        </span>
        <span>View cart ›</span>
      </button>
    </div>
  )
}
