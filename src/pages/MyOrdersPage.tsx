import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getMyOrders, lookupOrders } from '../api/shop'
import type { OrderView } from '../api/types'
import { CallButton } from '../components/CallButton'
import { OrderCard } from '../components/OrderCard'
import { isActive } from '../components/orderLabels'
import { useLiveUpdates } from '../lib/live'
import { savedOrders, savedTokens } from '../lib/savedOrders'
import { useNow } from '../lib/useNow'
import { useSession, useStore } from '../state/session'

/** Guests see orders saved in this browser; signed-in shoppers see all their orders. Updates arrive live. */
export function MyOrdersPage() {
  const session = useSession()
  const store = useStore().data
  const queryClient = useQueryClient()
  const now = useNow()
  const signedIn = session.data?.type === 'CUSTOMER'
  const tokens = savedTokens()

  const orders = useQuery<OrderView[]>({
    queryKey: ['orders', signedIn ? 'mine' : 'guest', tokens.join(',')],
    queryFn: () => (signedIn ? getMyOrders() : lookupOrders(tokens)),
    enabled: session.isSuccess && (signedIn || tokens.length > 0),
  })

  const list = orders.data ?? []
  const tokenOf = (orderNo: string) => savedOrders().find((o) => o.orderNo === orderNo)?.token ?? null
  const active = list.filter(isActive)
  const connected = useLiveUpdates(
    active.map((o) => ({ topic: `/topic/orders/${o.orderNo}`, token: tokenOf(o.orderNo) })),
    () => void queryClient.invalidateQueries({ queryKey: ['orders'] }),
  )
  // Fall back to checking every 15 seconds when live updates aren't connected.
  useQuery({
    queryKey: ['orders', 'poll', active.length],
    queryFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'], exact: false, refetchType: 'active' })
      return Date.now()
    },
    enabled: active.length > 0 && !connected,
    refetchInterval: 15_000,
  })

  return (
    <main className="wrap">
      <div className="tabs" role="tablist">
        <Link role="tab" aria-selected="false" to="/" className="tablink">Browse products</Link>
        <button type="button" role="tab" aria-selected="true">My orders{list.length ? ` (${list.length})` : ''}</button>
      </div>

      {store ? (
        <div className="helpbar">
          <span>Questions about an order? Call the store directly.</span>
          <CallButton mobile={store.phone} label="Call store" showNumber />
        </div>
      ) : null}

      {orders.isLoading ? (
        <div className="olist" aria-busy="true"><div className="skeleton" /><div className="skeleton" /></div>
      ) : orders.isError ? (
        <div className="empty">
          <div className="big">📡</div>
          <h3>Couldn’t load your orders</h3>
          <p>{orders.error.message}</p>
          <button type="button" className="primary" onClick={() => void orders.refetch()}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="big">🧺</div>
          <h3>No orders yet</h3>
          <p>Add a few items to your cart and place your first order.</p>
          <Link className="primary" to="/">Browse products</Link>
        </div>
      ) : (
        <div className="olist">
          {active.length > 0 ? (
            <span className={`livedot${connected ? ' on' : ''}`}>{connected ? 'Live updates on' : 'Checking for updates every 15 seconds'}</span>
          ) : null}
          {list.map((o) => <OrderCard key={o.orderNo} order={o} token={tokenOf(o.orderNo)} now={now} />)}
        </div>
      )}
    </main>
  )
}
