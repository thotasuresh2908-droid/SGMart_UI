import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="wrap">
      <div className="page-msg">
        <h1>Page not found</h1>
        <p className="muted">The link may be old or mistyped.</p>
        <p style={{ marginTop: 16 }}><Link className="primary" to="/">Go to the shop</Link></p>
      </div>
    </main>
  )
}
