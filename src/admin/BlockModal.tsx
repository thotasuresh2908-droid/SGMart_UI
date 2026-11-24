import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { blockCustomer } from '../api/admin'
import { Modal } from '../components/Modal'
import { phone } from '../lib/format'
import { useToast } from '../state/toast'

const REASONS = ['Refused delivery more than once', 'Fake or prank order', 'Abusive to staff', 'Other reason']

/** Block a number: it can't place online orders and is asked to call the store. */
export function BlockModal({ customerId, name, mobile, onClose }: { customerId: number; name: string; mobile: string | null; onClose: () => void }) {
  const [choice, setChoice] = useState(REASONS[0])
  const [other, setOther] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: (reason: string) => blockCustomer(customerId, reason),
    onSuccess: () => { toast(`${phone(mobile)} is blocked`); void queryClient.invalidateQueries({ queryKey: ['admin'] }); onClose() },
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const reason = choice === 'Other reason' ? other.trim() : choice
    if (reason.length < 3) {
      setError('Write the reason for blocking.')
      return
    }
    mutation.mutate(reason)
  }
  return (
    <Modal title={`Block ${name}?`} onClose={onClose}>
      <p className="muted">{phone(mobile)} won’t be able to place online orders and will be asked to call the store. You can unblock it any time in Settings.</p>
      <form className="pay" onSubmit={submit} noValidate>
        {REASONS.map((r) => (
          <label key={r}><input type="radio" name="block-reason" checked={choice === r} onChange={() => { setChoice(r); setError('') }} /> {r}</label>
        ))}
        {choice === 'Other reason' ? (
          <div className={`field${error ? ' bad' : ''}`}>
            <label htmlFor="block-other">Reason</label>
            <input id="block-other" maxLength={255} value={other} onChange={(e) => { setOther(e.target.value); setError('') }} />
            <p className="err">{error}</p>
          </div>
        ) : null}
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <button className="primary wide" style={{ background: 'var(--danger)', color: '#fff', marginTop: 6 }} disabled={mutation.isPending}>
          {mutation.isPending ? 'Blocking…' : 'Block number'}
        </button>
      </form>
    </Modal>
  )
}
