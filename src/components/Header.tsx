import { useSearchParams, useNavigate, useLocation } from 'react-router'
import { money } from '../lib/format'
import { useCart } from '../state/cart'
import { locationLabel, useDeliveryLocation } from '../state/location'
import { useSession, useStore } from '../state/session'
import { useUi } from '../state/ui'
import { Logo } from './Logo'

export function Header() {
  const ui = useUi()
  const cart = useCart()
  const store = useStore().data
  const session = useSession().data
  const { location } = useDeliveryLocation()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const onSearch = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    next.delete('category')
    if (pathname !== '/') navigate({ pathname: '/', search: next.toString() })
    else setParams(next, { replace: true })
  }

  const signedIn = session?.type === 'CUSTOMER'
  return (
    <header className="topbar">
      <Logo />
      <button type="button" className="loc" onClick={() => ui.open('location')}>
        <span className="ten">{store?.etaMinutes ?? 10}<small>min</small></span>
        <span className="where">
          <b>Delivery in {store?.etaMinutes ?? 10} minutes</b>
          <span>{locationLabel(location)}</span>
        </span>
      </button>
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder="Search milk, bread, rice, snacks…"
          aria-label="Search products"
          autoComplete="off"
          value={params.get('q') ?? ''}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <button type="button" className="loginbtn" onClick={() => ui.open('login')}>
        {signedIn ? `Hi, ${session?.name?.split(' ')[0] ?? ''}` : 'Log in'}
      </button>
      <button type="button" className="cartbtn" onClick={() => ui.open('cart')} aria-label="Open cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
          <circle cx="10" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" />
        </svg>
        {cart.count > 0 ? (
          <span className="cl">
            <span>{cart.count} item{cart.count > 1 ? 's' : ''}</span>
            <span>{money(cart.total)}</span>
          </span>
        ) : (
          <span>My cart</span>
        )}
      </button>
    </header>
  )
}
