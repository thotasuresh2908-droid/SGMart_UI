import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { deliverOrder } from '../api/admin'
import type { OrderView, PartnerView, PaymentMode } from '../api/types'
import { Modal } from '../components/Modal'
import { PAYMENT_METHOD_LABEL } from '../components/orderLabels'
import { money } from '../lib/format'
import { useToast } from '../state/toast'

interface Props {
  order: OrderView
  partners: PartnerView[]
  adminName: string
  onClose: () => void
}

/**
 * "Confirm delivery and payment". The amount is always the order total. Records cash or UPI,
 * who paid and which partner collected it; the signed-in admin is saved as the confirmer.
 */
export function DeliverModal({ order, partners, adminName, onClose }: Props) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const collectors = partners.filter((p) => p.active)
  const [method, setMethod] = useState<PaymentMode>(order.paymentMethod === 'UPI_ON_DELIVERY' ? 'UPI' : 'CASH')
  const [upiRef, setUpiRef] = useState('')
  const [paidBy, setPaidBy] = useState(order.customerName)
  const [collectedBy, setCollectedBy] = useState<number | ''>(order.deliveryPartner?.id ?? collectors[0]?.id ?? '')
  const [errors, setErrors] = useState<{ paidBy?: string; collectedBy?: string }>({})

  const mutation = useMutation({
    mutationFn: () => deliverOrder(order.orderNo, {
      method,
      paidByName: paidBy.trim(),
      collectedByPartnerId: Number(collectedBy),
      upiRef: method === 'UPI' ? upiRef.trim() || null : null,
    }),
    onSuccess: () => {
      toast(`Order ${order.orderNo} delivered. Payment of ${money(order.total)} confirmed.`)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      onClose()
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (paidBy.trim().length < 2) next.paidBy = 'Enter the name of the person who paid.'
    if (collectedBy === '') next.collectedBy = 'Choose who collected the payment.'
    setErrors(next)
    if (Object.keys(next).length === 0) mutation.mutate()
  }

  return (
    <Modal title="Confirm delivery and payment" onClose={onClose}>
      <p className="muted">Order #{order.orderNo} for {order.customerName}</p>
      <div className="paydue">
        <span className="small muted">Amount to collect</span>
        <b>{money(order.total)}</b>
        <span className="small muted">Customer chose {PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
      </div>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <fieldset className="pay">
          <legend>How did the customer pay?</legend>
          <label><input type="radio" name="pm" checked={method === 'CASH'} onChange={() => setMethod('CASH')} /> 💵 Cash</label>
          <label><input type="radio" name="pm" checked={method === 'UPI'} onChange={() => setMethod('UPI')} /> 📱 UPI</label>
        </fieldset>
        {method === 'UPI' ? (
          <div className="field">
            <label htmlFor="upi-ref">UPI transaction ID <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="upi-ref" maxLength={64} placeholder="12-digit UPI reference" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} />
          </div>
        ) : null}
        <div className={`field${errors.paidBy ? ' bad' : ''}`}>
          <label htmlFor="paid-by">Paid by <i>*</i></label>
          <input id="paid-by" maxLength={100} placeholder="Name of the person who paid" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} />
          <p className="err">{errors.paidBy}</p>
        </div>
        <div className={`field${errors.collectedBy ? ' bad' : ''}`}>
          <label htmlFor="collected-by">Collected by</label>
          <select id="collected-by" value={collectedBy} onChange={(e) => setCollectedBy(e.target.value ? Number(e.target.value) : '')}>
            {collectors.length === 0 ? <option value="">No delivery partners</option> : null}
            {collectors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="err">{errors.collectedBy}</p>
        </div>
        <p className="small muted">Confirmed by {adminName}, with today’s date and time.</p>
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
          <button className="primary wide" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Confirm delivered and paid'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
