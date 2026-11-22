import type { OrderView } from '../api/types'
import { clock, money } from '../lib/format'
import { PAYMENT_METHOD_LABEL } from './orderLabels'

/** "Cash on delivery: ₹126 to be collected", or the full trail once paid. */
export function PaymentBox({ order }: { order: OrderView }) {
  if (order.status === 'REJECTED' || order.status === 'CANCELLED') return null
  const p = order.payment
  if (!p) {
    if (order.status === 'DELIVERED') return null
    return (
      <div className="paybox pending">
        <span className="pico" aria-hidden="true">💳</span>
        <div>
          <b>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</b>
          <p className="small">{money(order.total)} to be collected when the order is delivered.</p>
        </div>
      </div>
    )
  }
  const how = p.method === 'UPI' ? 'UPI' : 'cash'
  return (
    <div className="paybox paid">
      <span className="pico" aria-hidden="true">✅</span>
      <div>
        <b>Paid {money(p.amount)} by {how}</b>
        <ol className="paysteps">
          <li>Customer chose {PAYMENT_METHOD_LABEL[order.paymentMethod]} at checkout</li>
          <li>
            {p.paidByName} paid {money(p.amount)} by {how}
            {p.upiRef ? ` (UPI ref ${p.upiRef})` : ''} to {p.collectedBy} at {clock(p.confirmedAt)}
          </li>
          <li>Payment confirmed by {p.confirmedBy}</li>
        </ol>
      </div>
    </div>
  )
}
