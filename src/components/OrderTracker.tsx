import type { OrderView } from '../api/types'
import { clock } from '../lib/format'

const STEPS = [
  { key: 'PLACED', label: 'Order placed', at: (o: OrderView) => o.placedAt },
  { key: 'ACCEPTED', label: 'Accepted', at: (o: OrderView) => o.acceptedAt },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way', at: (o: OrderView) => o.outForDeliveryAt },
  { key: 'DELIVERED', label: 'Delivered', at: (o: OrderView) => o.deliveredAt },
] as const

/** Placed → Accepted → On the way → Delivered, with the time of each step. */
export function OrderTracker({ order }: { order: OrderView }) {
  const current = STEPS.findIndex((s) => s.key === order.status)
  return (
    <ol className="track" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const at = step.at(order)
        const done = i <= current
        return (
          <li key={step.key} className={`${done ? 'done' : ''}${i === current ? ' now' : ''}`} aria-current={i === current ? 'step' : undefined}>
            {step.label}
            {at && done ? <time dateTime={at}>{clock(at)}</time> : null}
          </li>
        )
      })}
    </ol>
  )
}
