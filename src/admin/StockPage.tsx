import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { getStockReport } from '../api/admin'
import type { StockStatus } from '../api/types'
import { CallButton } from '../components/CallButton'
import { ProductPic } from '../components/ProductPic'
import { clock, initials, money, phone } from '../lib/format'
import { VEHICLE } from './adminLabels'
import { useAdminLive } from './liveContext'
import { StockModal, type StockTarget } from './StockModal'

const BADGE: Record<StockStatus, { cls: string; text: string }> = {
  IN_SHOP: { cls: 'out', text: 'In shop' },
  LOW_STOCK: { cls: 'new', text: 'Low stock, in shop' },
  OUT_OF_STOCK: { cls: 'rej', text: 'Out of stock, not in shop' },
  HIDDEN: { cls: 'done', text: 'Hidden by admin' },
}

const todayIst = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** Admin > Today's stock (or any earlier day). */
export function StockPage() {
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? ''
  const filter = params.get('show') ?? 'all'
  const live = useAdminLive()
  const report = useQuery({
    queryKey: ['admin', 'stock-report', date],
    queryFn: () => getStockReport(date || null),
    refetchInterval: live ? false : 30_000,
    placeholderData: (prev) => prev,
  })
  const [stockFor, setStockFor] = useState<StockTarget | null>(null)
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const r = report.data
  const isToday = !date || date === todayIst()
  const rows = (r?.products ?? []).filter((p) =>
    filter === 'low' ? p.status === 'LOW_STOCK' : filter === 'out' ? p.status === 'OUT_OF_STOCK' : true)
  const dateLabel = r ? new Date(`${r.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <>
      <div className="section-h" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h1>{isToday ? 'Today’s stock' : 'Stock report'}</h1>
        <label className="datefilter">
          Day
          <input type="date" value={date || todayIst()} max={todayIst()} onChange={(e) => set('date', e.target.value === todayIst() ? null : e.target.value)} />
        </label>
      </div>
      <p className="lead">
        {dateLabel}. Customers only see products that are in stock. A product hides from the shop when it reaches 0 and comes back as soon as you add stock.
      </p>

      {report.isLoading ? <div className="skeleton" /> : report.isError ? (
        <div className="empty panel"><h3>Couldn’t load the stock report</h3><p>{report.error.message}</p></div>
      ) : r ? (
        <>
          <div className="stats">
            <div className="stat"><span>Products in shop</span><b>{r.summary.productsInShop}</b><small>of {r.summary.liveProducts} live products</small></div>
            <div className="stat"><span>Units available</span><b>{r.summary.unitsAvailable}</b><small>across all products</small></div>
            <div className="stat"><span>Stock added</span><b>+{r.summary.unitsAdded}</b><small>{r.summary.productsRestocked} products restocked</small></div>
            <div className="stat"><span>Delivered</span><b>{r.summary.unitsDelivered}</b><small>units in {r.summary.ordersDelivered} order{r.summary.ordersDelivered === 1 ? '' : 's'}</small></div>
            <div className={`stat${r.summary.outOfStock ? ' hot' : ''}`}><span>Out of stock</span><b>{r.summary.outOfStock}</b><small>hidden from customers</small></div>
          </div>

          <div className="section-h" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h2>Stock by product</h2>
            <div className="chips" role="group" aria-label="Show">
              <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => set('show', null)}>All products</button>
              <button type="button" className="chip" aria-pressed={filter === 'low'} onClick={() => set('show', 'low')}>Low stock ({r.summary.lowStock})</button>
              <button type="button" className="chip" aria-pressed={filter === 'out'} onClick={() => set('show', 'out')}>Out of stock ({r.summary.outOfStock})</button>
            </div>
          </div>
          {rows.length === 0 ? (
            <div className="empty panel"><div className="big">✅</div><h3>Nothing here</h3><p>No products match this filter right now.</p></div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th><th className="num">Start of day</th><th className="num">Added</th><th className="num">Ordered</th>
                    <th className="num">Delivered</th><th className="num">{isToday ? 'Available now' : 'End of day'}</th><th>Shop status</th>{isToday ? <th /> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.productId}>
                      <td><div className="pcell"><span className="em" aria-hidden="true"><ProductPic imageUrl={p.imageUrl} icon={p.icon} /></span><div><b>{p.name}</b><span>{p.unit}</span></div></div></td>
                      <td className="num">{p.startOfDay}</td>
                      <td className="num">{p.added ? <span className="delta pos">+{p.added}</span> : '–'}{p.removed ? <div className="delta neg small">−{p.removed}</div> : null}</td>
                      <td className="num">{p.ordered || '–'}</td>
                      <td className="num">{p.delivered || '–'}</td>
                      <td className="num"><b style={{ fontSize: 16 }}>{p.available}</b></td>
                      <td><span className={`st ${BADGE[p.status].cls}`}>{BADGE[p.status].text}</span></td>
                      {isToday ? (
                        <td>
                          <button type="button" className="ghost updbtn" aria-label={`Update stock for ${p.name}`}
                                  onClick={() => setStockFor({ id: p.productId, name: p.name, unit: p.unit, icon: p.icon, imageUrl: p.imageUrl, stockQty: p.available })}>
                            Update stock
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="small muted">Start of day = available now − stock added + ordered. Items leave stock when the customer places the order.</p>

          <div className="section-h"><h2>Stock added</h2><span className="muted small">{r.restockLog.length} entr{r.restockLog.length === 1 ? 'y' : 'ies'}</span></div>
          {r.restockLog.length === 0 ? (
            <div className="empty panel"><div className="big">📦</div><h3>No stock added {isToday ? 'yet today' : 'this day'}</h3><p>Stock you add or correct is recorded here with the time and who did it.</p></div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Time</th><th>Product</th><th className="num">Quantity</th><th>Note</th><th>Added by</th></tr></thead>
                <tbody>
                  {r.restockLog.map((l, i) => (
                    <tr key={`${l.at}-${i}`}>
                      <td>{clock(l.at)}</td>
                      <td><div className="pcell"><span className="em" aria-hidden="true"><ProductPic imageUrl={l.imageUrl} icon={l.icon} /></span><div><b>{l.name}</b><span>{l.unit}</span></div></div></td>
                      <td className="num"><span className={`delta ${l.change > 0 ? 'pos' : 'neg'}`}>{l.change > 0 ? '+' : '−'}{Math.abs(l.change)}</span></td>
                      <td>{l.note}</td>
                      <td>{l.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="section-h"><h2>Delivered {isToday ? 'today' : 'this day'}</h2><span className="muted small">{r.deliveries.length} order{r.deliveries.length === 1 ? '' : 's'}, {r.summary.unitsDelivered} units</span></div>
          <div className="pgrid">
            {r.partners.map((p) => (
              <div className="pcard" key={p.partnerId}>
                <div className="top">
                  <span className="pav">{initials(p.name)}</span>
                  <div><b>{p.name}</b><span>{phone(p.mobile)}, {VEHICLE[p.vehicleType]}</span></div>
                  <CallButton mobile={p.mobile} label="Call" />
                </div>
                <p className="meta"><b style={{ color: 'var(--ink)', fontSize: 18 }}>{p.deliveries}</b> deliver{p.deliveries === 1 ? 'y' : 'ies'}, {p.units} unit{p.units === 1 ? '' : 's'}, {money(p.amount)}</p>
              </div>
            ))}
          </div>
          {r.deliveries.length === 0 ? (
            <div className="empty panel"><div className="big">🛵</div><h3>No deliveries completed {isToday ? 'yet today' : 'this day'}</h3><p>Orders marked as delivered appear here with the delivery partner’s name.</p></div>
          ) : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Delivered at</th><th>Order</th><th>Customer</th><th>Items</th><th>Delivered by</th><th className="num">Time taken</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {r.deliveries.map((d) => (
                    <tr key={d.orderNo}>
                      <td>{clock(d.deliveredAt)}</td>
                      <td><b>#{d.orderNo}</b></td>
                      <td><b>{d.customerName}</b><br /><a className="small" href={`tel:${d.customerMobile}`}>{phone(d.customerMobile)}</a></td>
                      <td>{d.units} units<br /><span className="small muted">{d.items}</span></td>
                      <td>{d.partnerName ? <><b>{d.partnerName}</b><br /><a className="small" href={`tel:${d.partnerMobile}`}>{phone(d.partnerMobile)}</a></> : '–'}</td>
                      <td className="num">{d.minutesTaken} min</td>
                      <td className="num"><b>{money(d.amount)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
      {stockFor ? <StockModal product={stockFor} onClose={() => setStockFor(null)} /> : null}
    </>
  )
}
