import type { OrderView } from '../api/types'
import { clock } from '../lib/format'

const SHOWN = new Set(['EDITED', 'ITEM_UNAVAILABLE', 'CANCELLED'])

/** Changes the shopper should know about: their edits, items the store couldn't supply, cancellation. */
export function OrderUpdates({ order }: { order: OrderView }) {
  const notes = order.updates.filter((u) => SHOWN.has(u.type) && u.message)
  if (notes.length === 0) return null
  return (
    <ul className="notes" aria-label="Order updates">
      {notes.map((u, i) => (
        <li key={`${u.at}-${i}`}>
          <time dateTime={u.at}>{clock(u.at)}</time>
          <b>{u.by}:</b> {u.message}
        </li>
      ))}
    </ul>
  )
}
