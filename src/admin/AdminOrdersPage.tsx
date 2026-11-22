import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { getAdminMe, getAdminOrders, getOrderCounts, getPartners } from '../api/admin'
import type { OrderStatus } from '../api/types'
import { money } from '../lib/format'
import { useNow } from '../lib/useNow'
import { STATUS_FILTERS } from './adminLabels'
import { AdminOrderCard } from './AdminOrderCard'
import { useAdminLive } from './liveContext'

/** Admin > Orders: tiles, filters, and the order queue (new orders first). */
export function AdminOrdersPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as OrderStatus | null) ?? null
  const date = params.get('date') ?? ''
  const page = Number(params.get('page') ?? 0)
  const live = useAdminLive()
  const now = useNow(30_000)
  const poll = live ? false : 15_000

  const counts = useQuery({ queryKey: ['admin', 'counts'], queryFn: getOrderCounts, refetchInterval: poll })
  const orders = useQuery({
    queryKey: ['admin', 'orders', status, date, page],
    queryFn: () => getAdminOrders({ status, date, page }),
    placeholderData: (prev) => prev,
    refetchInterval: poll,
  })
  const partners = useQuery({ queryKey: ['admin', 'partners'], queryFn: getPartners })
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: getAdminMe })

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const c = counts.data
  const list = orders.data?.items ?? []
  return (
    <>
      <h1>Orders</h1>
      <div className="stats">
        <div className={`stat${c?.newOrders ? ' hot' : ''}`}><span>New orders</span><b>{c?.newOrders ?? '–'}</b></div>
        <div className="stat"><span>Accepted</span><b>{c?.accepted ?? '–'}</b></div>
        <div className="stat"><span>Out for delivery</span><b>{c?.outForDelivery ?? '–'}</b></div>
        <div className="stat"><span>Delivered today</span><b>{c?.deliveredToday ?? '–'}</b></div>
        <div className="stat"><span>Delivered sales today</span><b>{c ? money(c.deliveredSalesToday) : '–'}</b></div>
      </div>

      <div className="section-h" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="chips" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button key={f.label} type="button" className="chip" aria-pressed={status === f.value} onClick={() => set('status', f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="datefilter">
          Placed on
          <input type="date" value={date} onChange={(e) => set('date', e.target.value || null)} />
          {date ? <button type="button" className="linkbtn small" onClick={() => set('date', null)}>Any day</button> : null}
        </label>
      </div>

      {orders.isLoading ? (
        <><div className="skeleton" /><div className="skeleton" /></>
      ) : orders.isError ? (
        <div className="empty panel">
          <div className="big">📡</div>
          <h3>Couldn’t load orders</h3>
          <p>{orders.error.message}</p>
          <button type="button" className="primary" onClick={() => void orders.refetch()}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="empty panel">
          <div className="big">📭</div>
          <h3>No orders here</h3>
          <p>{status || date ? 'Try another filter.' : 'New orders appear here the moment they are placed.'}</p>
        </div>
      ) : (
        list.map((v) => (
          <AdminOrderCard key={v.order.orderNo} view={v} partners={partners.data ?? []} adminName={me.data?.name ?? 'Store admin'} now={now} />
        ))
      )}

      {orders.data && orders.data.totalPages > 1 ? (
        <div className="pager">
          <button type="button" className="ghost" disabled={page === 0} onClick={() => set('page', String(page - 1))}>‹ Newer</button>
          <span className="muted small">Page {page + 1} of {orders.data.totalPages}</span>
          <button type="button" className="ghost" disabled={page + 1 >= orders.data.totalPages} onClick={() => set('page', String(page + 1))}>Older ›</button>
        </div>
      ) : null}
    </>
  )
}
