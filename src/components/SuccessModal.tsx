import { useNavigate } from 'react-router'
import type { PlacedOrder } from '../api/types'
import { etaText, money } from '../lib/format'
import { useNow } from '../lib/useNow'
import { Modal } from './Modal'
import { OrderTracker } from './OrderTracker'
import { PAYMENT_METHOD_LABEL } from './orderLabels'

export function SuccessModal({ placed, onClose }: { placed: PlacedOrder; onClose: () => void }) {
  const now = useNow()
  const navigate = useNavigate()
  const o = placed.order
  return (
    <Modal title="Order placed" onClose={onClose}>
      <div className="success-top">
        <div className="tick" aria-hidden="true">✓</div>
        <p className="muted">
          Order #{o.orderNo}, {money(o.total)}, {PAYMENT_METHOD_LABEL[o.paymentMethod]}
        </p>
      </div>
      <div className="box" style={{ textAlign: 'center' }}>
        <p className="etabig">{etaText(o.etaAt, o.deliveredAt, now)}</p>
        <p className="small muted">The store has your order and will accept it shortly.</p>
      </div>
      <OrderTracker order={o} />
      <p className="small muted" style={{ textAlign: 'center' }}>
        You can add or remove items, or cancel, until the store accepts the order.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="ghost wide" onClick={onClose}>Keep shopping</button>
        <button type="button" className="primary wide" onClick={() => { onClose(); navigate('/orders') }}>
          Track order
        </button>
      </div>
    </Modal>
  )
}
