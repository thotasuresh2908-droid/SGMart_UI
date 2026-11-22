import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { rejectOrder } from '../api/admin'
import { Modal } from '../components/Modal'
import { useToast } from '../state/toast'
import { REJECT_REASONS } from './adminLabels'

const OTHER = 'Other reason'

/** Reject a new order. The customer sees the reason; all stock goes back. */
export function RejectModal({ orderNo, onClose }: { orderNo: string; onClose: () => void }) {
  const [choice, setChoice] = useState(REJECT_REASONS[0])
  const [other, setOther] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (reason: string) => rejectOrder(orderNo, reason),
    onSuccess: () => {
      toast(`Order ${orderNo} rejected`)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      onClose()
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const reason = choice === OTHER ? other.trim() : choice
    if (choice === OTHER && reason.length < 3) {
      setError('Write the reason. The customer will see it.')
      return
    }
    mutation.mutate(reason)
  }

  return (
    <Modal title={`Reject order #${orderNo}?`} onClose={onClose}>
      <p className="muted">The customer will see the reason you pick. Items go back into stock.</p>
      <form className="pay" onSubmit={submit} noValidate>
        {[...REJECT_REASONS, OTHER].map((r) => (
          <label key={r}>
            <input type="radio" name="reason" checked={choice === r} onChange={() => { setChoice(r); setError('') }} /> {r}
          </label>
        ))}
        {choice === OTHER ? (
          <div className={`field${error ? ' bad' : ''}`}>
            <label htmlFor="other-reason">Reason</label>
            <input id="other-reason" maxLength={255} value={other} onChange={(e) => { setOther(e.target.value); setError('') }} />
            <p className="err">{error}</p>
          </div>
        ) : null}
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <button className="primary wide" style={{ background: 'var(--danger)', color: '#fff', marginTop: 6 }} disabled={mutation.isPending}>
          {mutation.isPending ? 'Rejecting…' : 'Reject order'}
        </button>
      </form>
    </Modal>
  )
}
