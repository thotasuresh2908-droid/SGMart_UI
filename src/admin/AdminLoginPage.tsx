import { Navigate, useSearchParams } from 'react-router'
import { signInAdminWithGoogle } from '../api/admin'
import { Logo } from '../components/Logo'
import { useSession } from '../state/session'

const ERRORS: Record<string, string> = {
  no_access: "This Google account doesn't have admin access. Ask the store owner to add your Gmail address.",
  failed: "Google sign-in didn't finish. Please try again.",
}

/** /admin/login. Only Gmail addresses on the store's admin list get in (checked by the backend). */
export function AdminLoginPage() {
  const session = useSession()
  const [params] = useSearchParams()
  const error = params.get('error')

  if (session.data?.type === 'ADMIN') return <Navigate to="/admin/orders" replace />
  return (
    <>
      <header className="topbar"><Logo /></header>
      <main className="wrap">
        <div className="gate">
          <div className="gcard">
            <span className="glock" aria-hidden="true">🔐</span>
            <h1>Store admin sign in</h1>
            <p className="muted">Only store staff can open the admin panel. Sign in with the Google account that manages this store.</p>
            {error ? <p className="errorbox" role="alert">{ERRORS[error] ?? ERRORS.failed}</p> : null}
            <button type="button" className="gbtn" onClick={signInAdminWithGoogle}>
              <span className="gG" aria-hidden="true">G</span>Sign in with Google
            </button>
            <a className="linkbtn small" href="/">Back to the shop</a>
          </div>
        </div>
      </main>
    </>
  )
}
