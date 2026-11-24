import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { updateStock } from '../api/admin'
import { Modal } from '../components/Modal'
import { ProductPic } from '../components/ProductPic'
import { useToast } from '../state/toast'

export interface StockTarget {
  id: number
  name: string
  unit: string
  icon: string
  imageUrl: string | null
  stockQty: number
}

const REASONS = [
  { value: 'SHELF_COUNT', label: 'Shelf count' },
  { value: 'DAMAGED', label: 'Damaged or expired' },
  { value: 'CORRECTION', label: 'Correction' },
] as const

/** "Update stock": add received stock, or set the exact count after a shelf count, with a preview. */
export function StockModal({ product, onClose }: { product: StockTarget; onClose: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [mode, setMode] = useState<'ADD' | 'SET'>('ADD')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('SHELF_COUNT')
  const [error, setError] = useState('')

  const n = /^\d+$/.test(qty) ? Number(qty) : null
  const next = n == null ? null : mode === 'ADD' ? product.stockQty + n : n
  const mutation = useMutation({
    mutationFn: () => updateStock(product.id, mode === 'ADD' ? { mode, qty: n! } : { mode, qty: n!, reason }),
    onSuccess: (r) => {
      toast(r.changed ? `${r.productName}: stock is now ${r.stockAfter}` : `No change. ${r.productName} stock is still ${r.stockAfter}.`)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (n == null || (mode === 'ADD' && n === 0)) {
      setError(mode === 'ADD' ? 'Enter how many units you received.' : 'Enter the number of units in the store (0 or more).')
      return
    }
    if (n > 100000) {
      setError('Quantity looks too large. Please check it.')
      return
    }
    mutation.mutate()
  }

  return (
    <Modal title="Update stock" onClose={onClose}>
      <div className="pcell">
        <span className="em" aria-hidden="true"><ProductPic imageUrl={product.imageUrl} icon={product.icon} /></span>
        <div><b>{product.name}</b><span>{product.unit}</span></div>
      </div>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="seg" role="radiogroup" aria-label="How do you want to update stock?">
          <label><input type="radio" name="mode" checked={mode === 'ADD'} onChange={() => { setMode('ADD'); setError('') }} /><span>Add new stock</span></label>
          <label><input type="radio" name="mode" checked={mode === 'SET'} onChange={() => { setMode('SET'); setError('') }} /><span>Set exact count</span></label>
        </div>
        <div className="stock-now"><span>Now in stock</span><b>{product.stockQty}</b></div>
        <div className={`field${error ? ' bad' : ''}`}>
          <label htmlFor="stock-qty">{mode === 'ADD' ? 'How many did you receive?' : 'How many are in the store right now?'}</label>
          <input id="stock-qty" inputMode="numeric" placeholder="e.g. 20" value={qty}
                 onChange={(e) => { setQty(e.target.value.replace(/\D/g, '')); setError('') }} />
          <p className="err">{error}</p>
        </div>
        {mode === 'ADD' ? (
          <div className="quick">
            {[5, 10, 25, 50].map((q) => (
              <button key={q} type="button" className="chip" onClick={() => { setQty(String((n ?? 0) + q)); setError('') }}>+{q}</button>
            ))}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="stock-reason">Reason</label>
            <select id="stock-reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div className="stock-prev" aria-live="polite">
          {next == null ? (
            <span className="muted small">Enter a quantity to see the new stock.</span>
          ) : (
            <>
              <span className="small">New stock</span>
              <b>{product.stockQty} → {next}</b>
              <span className="small">
                {next <= 0 ? 'The product will be hidden from customers.' : next <= 5 ? 'Low stock. Still shown in the shop.' : 'Shown in the shop.'}
              </span>
            </>
          )}
        </div>
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
          <button className="primary wide" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save stock'}</button>
        </div>
      </form>
    </Modal>
  )
}
