import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { getPaymentReport } from '../api/admin'
import { CallButton } from '../components/CallButton'
import { PAYMENT_METHOD_LABEL } from '../components/orderLabels'
import { clock, initials, money, phone, shortDate } from '../lib/format'
import { ADMIN_STATUS, VEHICLE } from './adminLabels'
import { useAdminLive } from './liveContext'

/** Admin > Payments: how much came in, in cash and UPI, who holds the cash, and what is still to collect. */
export function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const all = params.get('range') === 'all'
  const date = params.get('date') ?? ''
  const live = useAdminLive()
  const report = useQuery({
    queryKey: ['admin', 'payments', all, date],
    queryFn: () => getPaymentReport({ all, date: all ? null : date || null }),
    refetchInterval: live ? false : 30_000,
    placeholderData: (prev) => prev,
  })
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next)
  }

  const r = report.data
  const label = all ? 'all time' : date ? 'that day' : 'today'
  return (
    <>
      <h1>Payments</h1>
      <p className="lead">For every delivered order: how the customer paid, who paid, which delivery partner collected it, and which admin confirmed it.</p>
      <div className="section-h" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="chips" role="group" aria-label="Period">
          <button type="button" className="chip" aria-pressed={!all && !date} onClick={() => set({ range: null, date: null })}>Today</button>
          <button type="button" className="chip" aria-pressed={all} onClick={() => set({ range: 'all', date: null })}>All time</button>
        </div>
        <label className="datefilter">
          Another day
          <input type="date" value={all ? '' : date} onChange={(e) => set({ range: null, date: e.target.value || null })} />
        </label>
      </div>

      {report.isLoading ? <div className="skeleton" /> : report.isError ? (
        <div className="empty panel"><h3>Couldn’t load payments</h3><p>{report.error.message}</p></div>
      ) : r ? (
        <>
          <div className="stats">
            <div className="stat"><span>Collected</span><b>{money(r.totals.collected)}</b><small>{r.totals.payments} payment{r.totals.payments === 1 ? '' : 's'}, {label}</small></div>
            <div className="stat"><span>Cash</span><b>{money(r.totals.cash)}</b><small>collected by partners</small></div>
            <div className="stat"><span>UPI</span><b>{money(r.totals.upi)}</b><small>paid online</small></div>
            <div className={`stat${r.totals.activeOrders ? ' hot' : ''}`}><span>Still to collect</span><b>{money(r.totals.stillToCollect)}</b><small>{r.totals.activeOrders} active order{r.totals.activeOrders === 1 ? '' : 's'}</small></div>
            <div className="stat"><span>Average bill</span><b>{r.totals.averageBill != null ? money(r.totals.averageBill) : '–'}</b><small>{label}</small></div>
          </div>

          <div className="section-h"><h2>By delivery partner</h2><span className="muted small">{all ? 'All time' : label === 'today' ? 'Today' : 'That day'}</span></div>
          <div className="pgrid">
            {r.byPartner.map((p) => (
              <div className="pcard" key={p.partnerId}>
                <div className="top">
                  <span className="pav">{initials(p.name)}</span>
                  <div><b>{p.name}</b><span>{VEHICLE[p.vehicleType]}, {phone(p.mobile)}</span></div>
                  <CallButton mobile={p.mobile} label="Call" />
                </div>
                <div className="pmini">
                  <div><span>Deliveries</span><b>{p.deliveries}</b></div>
                  <div><span>Cash to hand over</span><b>{money(p.cashToHandOver)}</b></div>
                  <div><span>UPI received</span><b>{money(p.upi)}</b></div>
                </div>
                {p.onTheWay.length ? (
                  <p className="meta">On the way now: {p.onTheWay.map((o) => `#${o.orderNo}, ${money(o.amountDue)} (${PAYMENT_METHOD_LABEL[o.paymentMethod]})`).join('; ')}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="section-h"><h2>Still to collect</h2><span className="muted small">Accepted or on the way</span></div>
          {r.stillToCollect.length === 0 ? (
            <div className="empty panel"><div className="big">👍</div><h3>Nothing to collect right now</h3><p>Accepted and on-the-way orders show here until their payment is confirmed.</p></div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment method</th><th>Delivery partner</th><th className="num">Amount due</th></tr></thead>
                <tbody>
                  {r.stillToCollect.map((o) => (
                    <tr key={o.orderNo}>
                      <td><b>#{o.orderNo}</b></td>
                      <td><b>{o.customerName}</b><br /><a className="small" href={`tel:${o.customerMobile}`}>{phone(o.customerMobile)}</a></td>
                      <td><span className={`st ${ADMIN_STATUS[o.status].cls}`}>{ADMIN_STATUS[o.status].label}</span></td>
                      <td>{PAYMENT_METHOD_LABEL[o.paymentMethod]}</td>
                      <td>{o.partnerName ? <><b>{o.partnerName}</b><br /><a className="small" href={`tel:${o.partnerMobile}`}>{phone(o.partnerMobile)}</a></> : <span className="muted">Not assigned yet</span>}</td>
                      <td className="num"><b>{money(o.amountDue)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="section-h"><h2>Payment records</h2><span className="muted small">{r.records.length} record{r.records.length === 1 ? '' : 's'}</span></div>
          {r.records.length === 0 ? (
            <div className="empty panel"><div className="big">🧾</div><h3>No payments recorded {all ? 'yet' : label}</h3><p>When you mark an order as delivered, you confirm its payment and it appears here.</p></div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Time</th><th>Order</th><th>Paid by</th><th>Method</th><th>Collected by</th><th>Confirmed by</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {r.records.map((p, i) => (
                    <tr key={`${p.orderNo}-${i}`}>
                      <td>{all ? `${shortDate(p.at)}, ` : ''}{clock(p.at)}</td>
                      <td><b>#{p.orderNo}</b></td>
                      <td>{p.paidBy}</td>
                      <td>{p.method === 'UPI' ? '📱 UPI' : '💵 Cash'}{p.upiRef ? <><br /><span className="small muted">Ref {p.upiRef}</span></> : null}</td>
                      <td>{p.collectedBy}</td>
                      <td>{p.confirmedBy}</td>
                      <td className="num"><b>{money(p.amount)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </>
  )
}
