import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { editOrderItems, getProducts } from '../api/shop'
import type { OrderView, ShopProduct } from '../api/types'
import { money } from '../lib/format'
import { deliveryFee } from '../state/cartLogic'
import { useStore } from '../state/session'
import { useToast } from '../state/toast'
import { Modal } from './Modal'
import { ProductPic } from './ProductPic'
import { Stepper } from './Stepper'

interface Line {
  productId: number
  name: string
  unit: string
  icon: string
  imageUrl: string | null
  price: number
  qty: number
  original: number
  maxExtra: number
}

/**
 * "Add or remove items" while the store hasn't accepted. Items already in the order keep their
 * price; new items use today's price. The backend checks stock and the first-order limit again.
 */
export function EditOrderModal({ order, token, onClose }: { order: OrderView; token: string | null; onClose: () => void }) {
  const store = useStore().data
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState<Line[]>(() =>
    order.items
      .filter((i) => i.status === 'ACTIVE')
      .map((i) => ({ productId: i.productId, name: i.name, unit: i.unit, icon: i.icon, imageUrl: i.imageUrl, price: i.unitPrice, qty: i.qty, original: i.qty, maxExtra: 50 })),
  )

  const results = useQuery({
    queryKey: ['products', 'edit-search', search],
    queryFn: () => getProducts({ q: search, size: 8 }),
    staleTime: 30_000,
  })
  const inOrder = useMemo(() => new Set(lines.map((l) => l.productId)), [lines])
  const addable = (results.data?.items ?? []).filter((p) => !inOrder.has(p.id)).slice(0, 6)

  const setQty = (productId: number, qty: number) =>
    setLines((ls) => ls.flatMap((l) => {
      if (l.productId !== productId) return [l]
      if (qty <= 0 && l.original === 0) return []          // newly added, then removed: drop the line
      return [{ ...l, qty: Math.max(0, Math.min(qty, l.original + l.maxExtra)) }]
    }))

  const addProduct = (p: ShopProduct) =>
    setLines((ls) => [...ls, { productId: p.id, name: p.name, unit: p.unit, icon: p.icon, imageUrl: p.imageUrl, price: p.price, qty: 1, original: 0, maxExtra: p.stockLeft }])

  const itemTotal = Math.round(lines.reduce((t, l) => t + l.price * l.qty, 0) * 100) / 100
  const fee = deliveryFee(itemTotal, store)
  const newTotal = itemTotal + fee
  const changed = lines.some((l) => l.qty !== l.original)

  const mutation = useMutation({
    mutationFn: () => editOrderItems(order.orderNo, lines.filter((l) => l.qty > 0).map((l) => ({ productId: l.productId, qty: l.qty })), token),
    onSuccess: (updated) => {
      toast(`Order ${updated.orderNo} updated. New total ${money(updated.total)}`)
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  const save = () => {
    if (!changed) {
      onClose()
      toast('No changes made')
      return
    }
    if (lines.every((l) => l.qty === 0)) {
      mutation.reset()
      return
    }
    mutation.mutate()
  }

  const empty = lines.every((l) => l.qty === 0)
  return (
    <Modal title={`Edit order #${order.orderNo}`} onClose={onClose}>
      <p className="muted">Add or remove items before the store accepts your order.</p>
      <div className="box">
        {lines.map((l) => (
          <div className={`citem${l.qty ? '' : ' removed'}`} key={l.productId}>
            <span className="em" aria-hidden="true"><ProductPic imageUrl={l.imageUrl} icon={l.icon} /></span>
            <div className="nm"><b>{l.name}</b><span>{l.unit}, {money(l.price)}</span></div>
            {l.qty ? (
              <Stepper qty={l.qty} name={l.name} onAdd={() => setQty(l.productId, l.qty + 1)} onRemove={() => setQty(l.productId, l.qty - 1)} />
            ) : (
              <button type="button" className="linkbtn small" onClick={() => setQty(l.productId, 1)}>Undo</button>
            )}
            <span className="lp">{l.qty ? money(l.price * l.qty) : 'Removed'}</span>
          </div>
        ))}
      </div>

      <h3 className="mini">Add more items</h3>
      <input className="oe-search" type="search" placeholder="Search products to add" aria-label="Search products to add"
             value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="addlist">
        {addable.length === 0 ? (
          <p className="small muted" style={{ padding: '8px 0' }}>{results.isLoading ? 'Searching…' : 'No other products match.'}</p>
        ) : addable.map((p) => (
          <div className="addrow" key={p.id}>
            <span className="em" aria-hidden="true"><ProductPic imageUrl={p.imageUrl} icon={p.icon} /></span>
            <div className="nm"><b>{p.name}</b><br /><span className="small muted">{p.unit}, {money(p.price)}</span></div>
            <button type="button" className="add" onClick={() => addProduct(p)}>Add</button>
          </div>
        ))}
      </div>

      <div className="box bill">
        <div className="row"><span>Item total</span><span>{money(itemTotal)}</span></div>
        <div className="row"><span>Delivery fee</span><span>{fee ? money(fee) : 'Free'}</span></div>
        <div className="row grand"><span>New total</span><span>{money(newTotal)}</span></div>
        {newTotal !== order.total ? <p className="small muted">Was {money(order.total)}</p> : null}
      </div>
      {empty ? <p className="infobox">An order needs at least one item. To remove everything, cancel the order instead.</p> : null}
      {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
        <button type="button" className="primary wide" onClick={save} disabled={mutation.isPending || empty}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}
