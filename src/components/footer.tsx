import { Link } from 'react-router'
import { phone } from '../lib/format'
import { useStore } from '../state/session'

const YEAR = new Date().getFullYear()

/** Small footer on shop pages: store phone and the staff entry to the admin panel. */
export function Footer() {
  const store = useStore().data
  return (
    <footer className="sitefoot">
      <span>© {YEAR} {store?.storeName ?? 'SGMart'}</span>
      {store ? <a href={`tel:${store.phone}`}>📞 {phone(store.phone)}</a> : null}
      <Link to="/admin/login">Store admin sign in</Link>
    </footer>
  )
}
