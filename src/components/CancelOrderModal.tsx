import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { cancelOrder } from '../api/shop'
import type { OrderView } from '../api/types'
import { useToast } from '../state/toast'
import { Modal } from './Modal'

const REASONS = [
  'Ordered by mistake',
  'Want to change the address',
  'Want to order different items',
  'Delivery is taking too long',
  'Other reason',
]

export function CancelOrderModal({ order, token, onClose }: { order: OrderView; token: string | null; onClose: () => void }) {
  const [reason, setReason] = useState(REASONS[0])
  const queryClient = useQueryClient()
  const toast = useToast()
  const mutation = useMutation({
    mutationFn: () => cancelOrder(order.orderNo, reason, token),
    onSuccess: () => {
      toast(`Order ${order.orderNo} cancelled`)
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Modal title={`Cancel order #${order.orderNo}?`} onClose={onClose}>
      <p className="muted">The store hasn’t accepted it yet, so you can cancel for free.</p>
      <form className="pay" onSubmit={submit}>
        <legend className="sr-only">Why are you cancelling?</legend>
        {REASONS.map((r) => (
          <label key={r}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} /> {r}
          </label>
        ))}
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" className="ghost wide" onClick={onClose}>Keep order</button>
          <button className="primary wide" style={{ background: 'var(--danger)', color: '#fff' }} disabled={mutation.isPending}>
            {mutation.isPending ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
