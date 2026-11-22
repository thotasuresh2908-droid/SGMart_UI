import { useEffect, useState } from 'react'
import type { PlacedOrder } from '../api/types'
import { money } from '../lib/format'
import { useCart } from '../state/cart'
import { deliveryFee } from '../state/cartLogic'
import { useStore } from '../state/session'
import { useUi } from '../state/ui'
import { CheckoutForm } from './CheckoutForm'
import { ProductPic } from './ProductPic'
import { Stepper } from './Stepper'
import { SuccessModal } from './SuccessModal'

/** Right-side drawer: cart first, then delivery details. */
export function CartDrawer() {
  const ui = useUi()
  const cart = useCart()
  const store = useStore().data
  const [placed, setPlaced] = useState<PlacedOrder | null>(null)
  const open = ui.panel === 'cart' || ui.panel === 'checkout'

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, ui])

  const fee = deliveryFee(cart.total, store)
  const freeMin = store?.freeDeliveryMin ?? 0
  return (
    <>
      <div className={`scrim${open ? ' on' : ''}`} onClick={ui.close} aria-hidden="true" />
      <aside className={`drawer${open ? ' open' : ''}`} aria-label="Cart" aria-hidden={!open}>
        {ui.panel === 'checkout' ? (
          <>
            <div className="dhead">
              <button type="button" className="back" onClick={() => ui.open('cart')}>‹ Cart</button>
              <h2>Delivery details</h2>
              <button type="button" className="xbtn" onClick={ui.close} aria-label="Close">×</button>
            </div>
            <CheckoutForm store={store} onPlaced={(p) => { ui.close(); setPlaced(p) }} />
          </>
        ) : (
          <>
            <div className="dhead">
              <h2>My cart</h2>
              <button type="button" className="xbtn" onClick={ui.close} aria-label="Close">×</button>
            </div>
            {cart.count === 0 ? (
              <div className="dbody">
                <div className="empty">
                  <div className="big">🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Add items from the shop and they’ll show up here.</p>
                  <button type="button" className="primary" onClick={ui.close}>Browse products</button>
                </div>
              </div>
            ) : (
              <>
                <div className="dbody">
                  <div className="box eta-box">
                    <span className="ic" aria-hidden="true">⏱</span>
                    <div>
                      <b>Delivery in {store?.etaMinutes ?? 10} minutes</b>
                      <p className="small muted">{cart.count} item{cart.count > 1 ? 's' : ''} from your nearby store</p>
                    </div>
                  </div>
                  <div className="box">
                    {cart.lines.map(({ product, qty }) => (
                      <div className="citem" key={product.id}>
                        <span className="em" aria-hidden="true"><ProductPic imageUrl={product.imageUrl} icon={product.icon} /></span>
                        <div className="nm"><b>{product.name}</b><span>{product.unit}</span></div>
                        <Stepper qty={qty} name={product.name} onAdd={() => cart.add(product)} onRemove={() => cart.remove(product.id)} />
                        <span className="lp">{money(product.price * qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="box bill">
                    <h3>Bill details</h3>
                    <div className="row"><span>Item total</span><span>{money(cart.total)}</span></div>
                    <div className="row"><span>Delivery fee</span><span>{fee ? money(fee) : 'Free'}</span></div>
                    {fee ? <p className="hint">Add {money(freeMin - cart.total)} more for free delivery</p> : null}
                    <div className="row grand"><span>To pay</span><span>{money(cart.total + fee)}</span></div>
                  </div>
                </div>
                <div className="dfoot">
                  <button type="button" className="primary wide" onClick={() => ui.open('checkout')}>Continue to checkout</button>
                </div>
              </>
            )}
          </>
        )}
      </aside>
      {placed ? <SuccessModal placed={placed} onClose={() => setPlaced(null)} /> : null}
    </>
  )
}
