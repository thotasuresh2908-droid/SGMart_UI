import { Link } from 'react-router'

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="SGMart home">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--sun)" />
        <path d="M7 13h18l-2 10a2 2 0 0 1-2 1.6H11A2 2 0 0 1 9 23z" fill="var(--sun-ink)" />
        <path d="M11 13l4-6M21 13l-4-6" stroke="var(--sun-ink)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M17 15l-3 4h3l-2 3.5" stroke="var(--sun)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>sg<b>mart</b></span>
    </Link>
  )
}
