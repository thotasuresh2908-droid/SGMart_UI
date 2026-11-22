import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { getOrder } from '../api/shop'
import { OrderCard } from '../components/OrderCard'
import { isActive } from '../components/orderLabels'
import { useLiveUpdates } from '../lib/live'
import { tokenFor } from '../lib/savedOrders'
import { useNow } from '../lib/useNow'

/** /orders/SG1001: one order, for links shared from the order-placed screen or bookmarks. */
export function OrderPage() {
  const { orderNo = '' } = useParams()
  const token = tokenFor(orderNo)
  const queryClient = useQueryClient()
  const now = useNow()
  const order = useQuery({ queryKey: ['orders', 'one', orderNo], queryFn: () => getOrder(orderNo, token), retry: false })
  const live = order.data && isActive(order.data)
  const connected = useLiveUpdates(
    live ? [{ topic: `/topic/orders/${orderNo}`, token }] : [],
    () => void queryClient.invalidateQueries({ queryKey: ['orders'] }),
  )
  useQuery({
    queryKey: ['orders', 'one-poll', orderNo],
    queryFn: () => getOrder(orderNo, token).then((o) => { queryClient.setQueryData(['orders', 'one', orderNo], o); return o }),
    enabled: Boolean(live) && !connected,
    refetchInterval: 15_000,
  })

  if (order.isLoading) return <main className="wrap"><div className="olist"><div className="skeleton" /></div></main>
  if (order.isError || !order.data) {
    return (
      <main className="wrap">
        <div className="page-msg">
          <h1>Order not found</h1>
          <p className="muted">Open this link on the phone or browser you ordered from, or sign in with the Google account you used.</p>
          <p style={{ marginTop: 16 }}><Link className="primary" to="/orders">Go to My orders</Link></p>
        </div>
      </main>
    )
  }
  return (
    <main className="wrap">
      <div className="olist">
        <Link to="/orders" className="linkbtn small">‹ All my orders</Link>
        <OrderCard order={order.data} token={token} now={now} />
      </div>
    </main>
  )
}
