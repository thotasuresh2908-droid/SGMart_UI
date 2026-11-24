import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { getAdminMe, getOrderCounts } from '../api/admin'
import { logout } from '../api/shop'
import { Logo } from '../components/Logo'
import { initials, phone } from '../lib/format'
import { liveEnabled, useLiveUpdates } from '../lib/live'
import { readJson, writeJson } from '../lib/storage'
import { useSession, useStore } from '../state/session'
import { useToast } from '../state/toast'
import { AdminLiveContext } from './liveContext'
import { playNewOrderChime, unlockSound } from './sound'

/** "07:00:00" -> "7 am" */
function hour(t: string | undefined): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

const NAV = [
  { to: 'orders', label: 'Orders' },
  { to: 'stock', label: 'Today’s stock' },
  { to: 'products', label: 'Products' },
  { to: 'partners', label: 'Delivery partners' },
  { to: 'payments', label: 'Payments' },
  { to: 'settings', label: 'Settings' },
]

/** Admin shell: checks the session, side menu with counts, live new-order alerts with an optional chime. */
export function AdminLayout() {
  const session = useSession()
  const isAdmin = session.data?.type === 'ADMIN'
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: getAdminMe, enabled: isAdmin })
  const counts = useQuery({ queryKey: ['admin', 'counts'], queryFn: getOrderCounts, enabled: isAdmin })
  const store = useStore().data
  const queryClient = useQueryClient()
  const toast = useToast()
  const [soundOn, setSoundOn] = useState(() => readJson<boolean>('sgmart.admin.sound', false))

  const connected = useLiveUpdates(isAdmin ? [{ topic: '/topic/admin/orders' }, { topic: '/topic/admin/stock' }] : [], (m) => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
    if (!m.orderNo) return
    if (m.change === 'PLACED') {
      if (soundOn) playNewOrderChime()
      toast(`New order ${m.orderNo}`)
    } else if (m.change === 'EDITED') {
      toast(`${m.orderNo} was changed by the customer`)
    } else if (m.change === 'CANCELLED') {
      toast(`${m.orderNo} was cancelled by the customer`)
    }
  })

  if (session.isLoading) return <main className="wrap"><div className="skeleton" /></main>
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const toggleSound = () => {
    const next = !soundOn
    if (next) {
      unlockSound()
      playNewOrderChime()
    }
    setSoundOn(next)
    writeJson('sgmart.admin.sound', next)
  }

  const signOut = async () => {
    try {
      await logout()
    } finally {
      queryClient.clear()
      window.location.href = '/admin/login'
    }
  }

  const newOrders = counts.data?.newOrders ?? 0
  return (
    <AdminLiveContext.Provider value={connected}>
      <header className="topbar">
        <Logo />
        <span className="admintag">Store admin</span>
        <span className="spacer" />
        <span className={`livedot${connected ? ' on' : ''}`}>{connected ? 'Live' : liveEnabled ? 'Reconnecting…' : 'Auto-refresh every 15 s'}</span>
        <button type="button" className="ghost soundbtn" onClick={toggleSound} aria-pressed={soundOn}>
          {soundOn ? '🔔 Sound on' : '🔕 Sound off'}
        </button>
        <a className="loginbtn" href="/" target="_blank" rel="noopener">Open shop</a>
      </header>
      <main className="wrap">
        <div className="awrap">
          <nav className="anav" aria-label="Admin sections">
            <div className="acct">
              <span className="av">{initials(me.data?.name ?? session.data?.name ?? 'A')}</span>
              <div>
                <b>{me.data?.name ?? session.data?.name}</b>
                <span className="mail">{me.data?.email ?? session.data?.email}</span>
              </div>
            </div>
            {store ? (
              <div className="store">
                <b>{store.storeName} store</b>
                <span className={store.openNow ? 'open' : 'closed'}>
                  {store.openNow ? 'Open' : 'Closed'}, {hour(store.opensAt)} to {hour(store.closesAt)}
                </span>
                <span className="sphone">📞 {phone(store.phone)}</span>
              </div>
            ) : null}
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
                <span>{n.label}</span>
                {n.to === 'orders' && newOrders > 0 ? <span className="badge-n">{newOrders}</span> : null}
              </NavLink>
            ))}
            <button type="button" className="reset" onClick={signOut}>Sign out</button>
          </nav>
          <section className="abody">
            <Outlet />
          </section>
        </div>
      </main>
    </AdminLiveContext.Provider>
  )
}
