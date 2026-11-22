import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { acceptOrder, dispatchOrder, verifyCustomer } from '../api/admin'
import { ApiError } from '../api/client'
import type { AdminOrderView, PartnerView } from '../api/types'
import { CallButton } from '../components/CallButton'
import { PaymentBox } from '../components/PaymentBox'
import { clock, initials, money, phone, relative } from '../lib/format'
import { deliveryFee } from '../state/cartLogic'
import { useStore } from '../state/session'
import { useToast } from '../state/toast'
import { ADMIN_STATUS, UNAVAILABLE_REASONS, VEHICLE } from './adminLabels'
import { DeliverModal } from './DeliverModal'
import { RejectModal } from './RejectModal'

interface Props {
  view: AdminOrderView
  partners: PartnerView[]
  adminName: string
  now: number
}

/** One order in Admin > Orders, with the next action for its status. */
export function AdminOrderCard({ view, partners, adminName, now }: Props) {
  const { order: o, customer: c } = view
  const queryClient = useQueryClient()
  const toast = useToast()
  const store = useStore().data
  const [unavailable, setUnavailable] = useState<Record<number, string>>({})
  const [callConfirmed, setCallConfirmed] = useState(false)
  const [partnerId, setPartnerId] = useState<number | ''>('')
  const [rejecting, setRejecting] = useState(false)
  const [delivering, setDelivering] = useState(false)

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin'] })
  const onError = (e: Error) => {
    if (e instanceof ApiError && e.status === 409) refresh()
  }

  const accept = useMutation({
    mutationFn: () => acceptOrder(o.orderNo, Object.entries(unavailable).map(([itemId, reason]) => ({ itemId: Number(itemId), reason })), callConfirmed),
    onSuccess: () => {
      const dropped = Object.keys(unavailable).length
      toast(dropped ? `Order ${o.orderNo} accepted with ${active.length - dropped} of ${active.length} items` : `Order ${o.orderNo} accepted. Choose a delivery partner next.`)
      refresh()
    },
    onError,
  })
  const dispatch = useMutation({
    mutationFn: () => dispatchOrder(o.orderNo, Number(partnerId)),
    onSuccess: () => {
      const p = partners.find((x) => x.id === partnerId)
      toast(`${p?.name ?? 'The partner'} is on the way with order ${o.orderNo}`)
      refresh()
    },
    onError,
  })
  const verify = useMutation({
    mutationFn: () => verifyCustomer(c!.id),
    onSuccess: () => { toast('Mobile number marked verified'); refresh() },
  })

  const st = ADMIN_STATUS[o.status]
  const active = o.items.filter((i) => i.status === 'ACTIVE')
  const notAvailable = o.items.filter((i) => i.status === 'NOT_AVAILABLE')
  const unavailableCount = Object.keys(unavailable).length
  const okN = active.length - unavailableCount
  const keepTotal = active.filter((i) => !(i.id in unavailable)).reduce((t, i) => t + i.lineTotal, 0)
  const newTotal = keepTotal + deliveryFee(keepTotal, store)
  const needsCall = o.status === 'PLACED' && Boolean(c?.newCustomer)
  const available = partners.filter((p) => p.active && p.status === 'AVAILABLE')
  const partner = o.deliveryPartner
  const busyError = accept.error ?? dispatch.error

  const toggleItem = (itemId: number, ok: boolean) =>
    setUnavailable((u) => {
      const next = { ...u }
      if (ok) delete next[itemId]
      else next[itemId] = UNAVAILABLE_REASONS[0]
      return next
    })

  return (
    <article className={`aorder s-${o.status === 'OUT_FOR_DELIVERY' ? 'out' : o.status.toLowerCase()}`}>
      <header>
        <div>
          <h3>#{o.orderNo}</h3>
          <p className="muted small">{relative(o.placedAt, now)}, {clock(o.placedAt)}</p>
        </div>
        <span className={`st ${st.cls}`}>{st.label}</span>
      </header>

      <div className="acols">
        <div>
          <h4>Customer</h4>
          <p><b>{o.customerName}</b></p>
          <p style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0' }}>
            {c?.blocked ? <span className="blockbadge">Blocked: {c.blockedReason}</span> : null}
            {c?.newCustomer ? (
              <>
                <span className="newbadge">New customer</span>
                {o.status !== 'PLACED' ? (
                  <button type="button" className="linkbtn small" onClick={() => verify.mutate()} disabled={verify.isPending}>Mark verified</button>
                ) : null}
              </>
            ) : c?.mobileVerified || (c && c.deliveredOrders > 0) ? (
              <span className="okbadge">✓ {c.deliveredOrders} delivered order{c.deliveredOrders === 1 ? '' : 's'}</span>
            ) : null}
          </p>
          <p><a href={`tel:${o.customerMobile}`}>{phone(o.customerMobile)}</a></p>
          <div className="callrow"><CallButton mobile={o.customerMobile} label="Call customer" /></div>
          <p>{o.addressLine}</p>
          {o.landmark ? <p className="muted small">Landmark: {o.landmark}</p> : null}
          {o.latitude != null && o.longitude != null ? (
            <p style={{ marginTop: 6 }}>
              <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}>📍 Open customer location in Maps</a>
            </p>
          ) : (
            <p className="muted small" style={{ marginTop: 6 }}>No GPS location shared, use the typed address.</p>
          )}
        </div>

        <div>
          <h4>Items ({o.itemCount})</h4>
          {o.status === 'PLACED' ? (
            <>
              <p className="small muted" style={{ marginBottom: 8 }}>Check each item. Mark anything you can’t supply as not available.</p>
              <ul className="icheck">
                {active.map((i) => {
                  const ok = !(i.id in unavailable)
                  return (
                    <li key={i.id} className={ok ? '' : 'no'}>
                      <div className="ir">
                        <span>{i.icon} {i.qty} × {i.name} <span className="muted">({i.unit})</span></span>
                        <b>{money(i.lineTotal)}</b>
                      </div>
                      <div className="iseg">
                        <button type="button" className="yes" aria-pressed={ok} onClick={() => toggleItem(i.id, true)}>✓ Available</button>
                        <button type="button" className="no" aria-pressed={!ok} onClick={() => toggleItem(i.id, false)}>✗ Not available</button>
                        {!ok ? (
                          <select aria-label={`Why ${i.name} is not available`} value={unavailable[i.id]}
                                  onChange={(e) => setUnavailable((u) => ({ ...u, [i.id]: e.target.value }))}>
                            {UNAVAILABLE_REASONS.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <ul className="ilist">
              {active.map((i) => (
                <li key={i.id}>
                  <span>{i.icon} {i.qty} × {i.name} <span className="muted">({i.unit})</span></span>
                  <span>{money(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
          {notAvailable.length ? (
            <p className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>
              Removed by store: {notAvailable.map((i) => `${i.qty} × ${i.name} (${i.unavailableReason})`).join(', ')}
            </p>
          ) : null}
          <div className="atotal"><span>Total, {o.paymentMethod === 'UPI_ON_DELIVERY' ? 'UPI on delivery' : 'Cash on delivery'}</span><b>{money(o.total)}</b></div>
        </div>
      </div>

      {o.updates.some((u) => u.type === 'EDITED' || u.type === 'CANCELLED') ? (
        <ul className="notes" aria-label="Customer changes">
          {o.updates.filter((u) => u.type === 'EDITED' || u.type === 'CANCELLED').map((u, k) => (
            <li key={k}><time dateTime={u.at}>{clock(u.at)}</time><b>{u.by}:</b> {u.message}</li>
          ))}
        </ul>
      ) : null}

      {partner && o.status === 'OUT_FOR_DELIVERY' ? (
        <div className="rider">
          <span className="av">{initials(partner.name)}</span>
          <div style={{ flex: 1 }}>
            <b>{partner.name}</b> is delivering this order
            <br /><span className="small muted">{VEHICLE[partner.vehicleType]}, <a href={`tel:${partner.mobile}`}>{phone(partner.mobile)}</a></span>
          </div>
          <CallButton mobile={partner.mobile} label="Call partner" />
        </div>
      ) : null}

      {o.status !== 'PLACED' ? <PaymentBox order={o} /> : null}

      <div className="aactions">
        {o.status === 'PLACED' ? (
          <>
            {needsCall ? (
              <label className="confirmcall">
                <input type="checkbox" checked={callConfirmed} onChange={(e) => setCallConfirmed(e.target.checked)} />
                <span>This is a new customer. I called <b>{phone(o.customerMobile)}</b> and confirmed the order.</span>
              </label>
            ) : null}
            {okN === active.length ? (
              <button type="button" className="primary" onClick={() => accept.mutate()} disabled={accept.isPending || (needsCall && !callConfirmed)}>
                {accept.isPending ? 'Accepting…' : 'Accept order'}
              </button>
            ) : okN > 0 ? (
              <>
                <p className="accprev">
                  Accepting {okN} of {active.length} items. New total <b>{money(newTotal)}</b> (was {money(o.total)}).
                  The customer will see which items weren’t available and why.
                </p>
                <button type="button" className="primary" onClick={() => accept.mutate()} disabled={accept.isPending || (needsCall && !callConfirmed)}>
                  {accept.isPending ? 'Accepting…' : `Accept ${okN} of ${active.length} items`}
                </button>
              </>
            ) : (
              <p className="accprev">None of the items are available, so this order can’t be accepted.</p>
            )}
            <button type="button" className="ghost danger" onClick={() => setRejecting(true)}>
              {okN === active.length ? 'Reject' : okN > 0 ? 'Reject whole order' : 'Reject order'}
            </button>
          </>
        ) : o.status === 'ACCEPTED' ? (
          available.length ? (
            <>
              <div className="field">
                <label htmlFor={`partner-${o.orderNo}`}>Assign delivery partner</label>
                <select id={`partner-${o.orderNo}`} value={partnerId} onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Choose a partner</option>
                  {available.map((p) => <option key={p.id} value={p.id}>{p.name} ({VEHICLE[p.vehicleType]})</option>)}
                </select>
              </div>
              <button type="button" className="primary" onClick={() => dispatch.mutate()} disabled={partnerId === '' || dispatch.isPending}>
                {dispatch.isPending ? 'Sending…' : 'Send out for delivery'}
              </button>
            </>
          ) : (
            <>
              <p className="small muted">No delivery partners are available right now. Mark a partner as available in Delivery partners.</p>
              <Link className="ghost" to="/admin/partners">Go to delivery partners</Link>
            </>
          )
        ) : o.status === 'OUT_FOR_DELIVERY' ? (
          <button type="button" className="primary" onClick={() => setDelivering(true)}>Mark as delivered</button>
        ) : o.status === 'DELIVERED' ? (
          <>
            <p className="small muted">
              Delivered at {clock(o.deliveredAt)}{partner ? ` by ${partner.name}` : ''},{' '}
              {Math.max(1, Math.round((Date.parse(o.deliveredAt ?? o.placedAt) - Date.parse(o.placedAt)) / 60000))} min after ordering.
            </p>
            {partner ? <CallButton mobile={partner.mobile} label={`Call ${partner.name.split(' ')[0]}`} /> : null}
          </>
        ) : o.status === 'CANCELLED' ? (
          <p className="small" style={{ color: 'var(--danger)' }}>Cancelled by the customer{o.cancelReason ? `: ${o.cancelReason}` : ''}. Stock was returned to the store.</p>
        ) : (
          <p className="small" style={{ color: 'var(--danger)' }}>Rejected: {o.rejectReason}. Stock was returned to the store.</p>
        )}
        {busyError ? <p className="errorbox" role="alert" style={{ width: '100%' }}>{busyError.message}</p> : null}
      </div>

      {o.updates.length ? (
        <details className="history">
          <summary>Order history ({o.updates.length})</summary>
          <ul className="notes" style={{ marginTop: 8 }}>
            {o.updates.map((u, k) => (
              <li key={k}><time dateTime={u.at}>{clock(u.at)}</time><b>{u.by}:</b> {u.message}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {rejecting ? <RejectModal orderNo={o.orderNo} onClose={() => setRejecting(false)} /> : null}
      {delivering ? <DeliverModal order={o} partners={partners} adminName={adminName} onClose={() => setDelivering(false)} /> : null}
    </article>
  )
}
