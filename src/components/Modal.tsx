import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Centred window with a close button. Esc and clicking outside close it; focus moves inside. */
export function Modal({ title, onClose, children }: Props) {
  const titleId = useId()
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const first = card.current?.querySelector<HTMLElement>('input, select, textarea, button.primary')
    first?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mcard" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={card}>
        <button type="button" className="xbtn" onClick={onClose} aria-label="Close">×</button>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
