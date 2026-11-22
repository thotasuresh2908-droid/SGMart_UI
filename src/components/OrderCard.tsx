import { useState } from 'react'
import type { OrderView } from '../api/types'
import { clock, etaText, initials, money, phone, relative } from '../lib/format'
import { CallButton } from './CallButton'
import { CancelOrderModal } from './CancelOrderModal'
import { EditOrderModal } from './EditOrderModal'
import { OrderTracker } from './OrderTracker'
import { OrderUpdates } from './OrderUpdates'
import { CUSTOMER_STATUS } from './orderLabels'
import { PaymentBox } from './PaymentBox'

/** One order in "My orders": status, countdown, partner, updates, payment, and what the shopper can do now. */
export function OrderCard({ order, token, now }: { order: OrderView; token: string | null; now: number }) {
  const [editing, setEditing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const st = CUSTOMER_STATUS[order.status]
  const partner = order.deliveryPartner
  const items = order.items.filter((i) => i.status === 'ACTIVE')
  const unavailable = order.items.filter((i) => i.status === 'NOT_AVAILABLE')

  return (
    <article className="ocard">
      <header>
        <div>
          <h3>Order #{order.orderNo}</h3>
          <p className="muted small">
            {relative(order.placedAt, now)}, {clock(order.placedAt)}, {order.itemCount} item{order.itemCount === 1 ? '' : 's'}, {money(order.total)}
          </p>
        </div>
        <span className={`st ${st.cls}`}>{st.label}</span>
      </header>

      {order.status === 'REJECTED' ? (
        <p className="reject">The store couldn’t accept this order: {order.rejectReason}. You haven’t been charged.</p>
      ) : order.status === 'CANCELLED' ? (
        <p className="reject">You cancelled this order{order.cancelReason ? `: ${order.cancelReason}` : ''}. You haven’t been charged.</p>
      ) : (
        <>
          <OrderTracker order={order} />
          <p className="etaline">{etaText(order.etaAt, order.deliveredAt, now)}</p>
        </>
      )}

      {partner && order.status === 'OUT_FOR_DELIVERY' ? (
        <div className="rider">
          <span className="av">{initials(partner.name)}</span>
          <div>
            <b>{partner.name}</b> is on the way on a {partner.vehicleType.toLowerCase()}.
            <br /><a href={`tel:${partner.mobile}`}>Call {phone(partner.mobile)}</a>
          </div>
        </div>
      ) : null}
      {partner && order.status === 'DELIVERED' ? <p className="muted small">Delivered by {partner.name}</p> : null}

      <OrderUpdates order={order} />
      <PaymentBox order={order} />

      {order.status === 'PLACED' ? (
        <>
          <div className="oacts">
            <button type="button" className="ghost" onClick={() => setEditing(true)}>✏️ Add or remove items</button>
            <button type="button" className="ghost danger" onClick={() => setCancelling(true)}>Cancel order</button>
            <CallButton mobile={order.storePhone} label="Call store" variant="ghost" />
          </div>
          <p className="small muted">You can change or cancel this order until the store accepts it.</p>
        </>
      ) : order.status === 'ACCEPTED' ? (
        <>
          <div className="oacts"><CallButton mobile={order.storePhone} label="Call store" variant="ghost" /></div>
          <p className="small muted">The store has accepted your order, so it can’t be changed here. Call the store if you need anything.</p>
        </>
      ) : order.status === 'OUT_FOR_DELIVERY' ? (
        <div className="oacts">
          {partner ? <CallButton mobile={partner.mobile} label="Call delivery partner" variant="primary" /> : null}
          <CallButton mobile={order.storePhone} label="Call store" variant="ghost" />
        </div>
      ) : (
        <div className="oacts"><CallButton mobile={order.storePhone} label="Call store" variant="ghost" /></div>
      )}

      <details>
        <summary>View items and address</summary>
        <ul className="ilist">
          {items.map((i) => (
            <li key={i.id}>
              <span>{i.icon} {i.qty} × {i.name} <span className="muted">({i.unit})</span></span>
              <span>{money(i.lineTotal)}</span>
            </li>
          ))}
          {unavailable.map((i) => (
            <li key={i.id} className="muted">
              <span><s>{i.qty} × {i.name}</s> not available ({i.unavailableReason})</span>
            </li>
          ))}
        </ul>
        <div className="bill" style={{ marginTop: 8 }}>
          <div className="row"><span>Item total</span><span>{money(order.itemTotal)}</span></div>
          <div className="row"><span>Delivery fee</span><span>{order.deliveryFee ? money(order.deliveryFee) : 'Free'}</span></div>
          <div className="row grand"><span>Total</span><span>{money(order.total)}</span></div>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          Deliver to {order.customerName}, {order.addressLine}{order.landmark ? ` (${order.landmark})` : ''}
        </p>
      </details>

      {editing ? <EditOrderModal order={order} token={token} onClose={() => setEditing(false)} /> : null}
      {cancelling ? <CancelOrderModal order={order} token={token} onClose={() => setCancelling(false)} /> : null}
    </article>
  )
}
