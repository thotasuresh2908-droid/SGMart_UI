import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { claimOrders, getCategories, getProducts } from '../api/shop'
import { ProductCard } from '../components/ProductCard'
import { money } from '../lib/format'
import { savedTokens } from '../lib/savedOrders'
import { useCart } from '../state/cart'
import { refresh } from '../state/cartLogic'
import { useStore } from '../state/session'
import { useToast } from '../state/toast'

const LOGIN_ERRORS: Record<string, string> = {
  email_not_verified: 'Your Google account email is not verified. Verify it with Google, then try again.',
  failed: "Google sign-in didn't finish. Please try again.",
}

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ? Number(params.get('category')) : null
  const q = params.get('q') ?? ''
  const store = useStore().data
  const cart = useCart()
  const toast = useToast()
  const queryClient = useQueryClient()

  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 5 * 60_000 })
  const products = useQuery({
    queryKey: ['products', category, q],
    queryFn: () => getProducts({ category, q }),
    placeholderData: (previous) => previous,
  })

  // Keep cart prices and stock in step with what the shop shows now.
  useEffect(() => {
    if (products.data) cart.replace(refresh(cart.cart, products.data.items))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.data])

  // Back from Google: link this browser's guest orders to the account, or explain what went wrong.
  useEffect(() => {
    const signedIn = params.get('signed_in')
    const loginError = params.get('login_error')
    if (!signedIn && !loginError) return
    const next = new URLSearchParams(params)
    next.delete('signed_in')
    next.delete('login_error')
    setParams(next, { replace: true })
    if (loginError) {
      toast(LOGIN_ERRORS[loginError] ?? LOGIN_ERRORS.failed)
      return
    }
    void queryClient.invalidateQueries({ queryKey: ['session'] })
    const tokens = savedTokens()
    if (tokens.length === 0) {
      toast('Signed in')
      return
    }
    claimOrders(tokens)
      .then((r) => toast(r.linked > 0 ? `Signed in. ${r.linked} earlier order${r.linked > 1 ? 's are' : ' is'} now in your account.` : 'Signed in'))
      .catch(() => toast('Signed in'))
      .finally(() => void queryClient.invalidateQueries({ queryKey: ['orders'] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCategory = (id: number | null) => {
    const next = new URLSearchParams(params)
    if (id == null) next.delete('category')
    else next.set('category', String(id))
    next.delete('q')
    setParams(next)
  }

  const title = q ? `Results for “${q}”` : category ? categories.data?.find((c) => c.id === category)?.name ?? 'Products' : 'All products'
  const items = products.data?.items ?? []
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>Groceries at your door in {store?.etaMinutes ?? 10} minutes</h1>
          <p>Fresh produce, dairy and daily essentials, packed at your neighbourhood store and delivered fast.</p>
        </div>
        <div className="perks">
          <div className="perk"><b>Free delivery</b>on orders above {money(store?.freeDeliveryMin ?? 199)}</div>
          <div className="perk"><b>Cash or UPI</b>pay when it arrives</div>
          {store ? <a className="perk" href={`tel:${store.phone}`}><b>📞 Call the store</b><span>{store.phone.slice(0, 5)} {store.phone.slice(5)}</span></a> : null}
        </div>
      </section>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected="true">Browse products</button>
        <Link role="tab" aria-selected="false" to="/orders" className="tablink">My orders</Link>
      </div>

      <div className="cats" role="group" aria-label="Categories">
        <button type="button" className="cat" aria-pressed={category == null && !q} onClick={() => setCategory(null)}>
          <span className="ci" aria-hidden="true">🛒</span>All
        </button>
        {categories.data?.map((c) => (
          <button type="button" key={c.id} className="cat" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            <span className="ci" aria-hidden="true">{c.icon}</span>{c.name}
          </button>
        ))}
      </div>

      <div className="section-h">
        <h2>{title}</h2>
        {products.data ? <span className="muted small">{products.data.totalItems} item{products.data.totalItems === 1 ? '' : 's'}</span> : null}
      </div>

      {products.isLoading ? (
        <div className="grid" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <div className="skeleton" key={i} />)}</div>
      ) : products.isError ? (
        <div className="empty">
          <div className="big">📡</div>
          <h3>Couldn’t load products</h3>
          <p>{products.error.message}</p>
          <button type="button" className="primary" onClick={() => void products.refetch()}>Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="big">🔍</div>
          <h3>No products match</h3>
          <p>Try another word, or browse all categories.</p>
          <button type="button" className="ghost" onClick={() => setCategory(null)}>Show all products</button>
        </div>
      ) : (
        <div className="grid">
          {items.map((p) => <ProductCard key={p.id} product={p} etaMinutes={store?.etaMinutes ?? 10} />)}
        </div>
      )}
    </main>
  )
}
