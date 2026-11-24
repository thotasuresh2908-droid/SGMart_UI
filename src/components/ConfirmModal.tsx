import { Modal } from './Modal'

interface Props {
  title: string
  text: string
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

/** "Are you sure?" with a red confirm button. */
export function ConfirmModal({ title, text, confirmLabel, busy, error, onConfirm, onClose }: Props) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{text}</p>
      {error ? <p className="errorbox" role="alert">{error}</p> : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
        <button type="button" className="primary wide" style={{ background: 'var(--danger)', color: '#fff' }} onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
