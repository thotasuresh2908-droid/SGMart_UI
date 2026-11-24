import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getAdminProducts, removeProduct, updateProduct } from '../api/admin'
import { getCategories } from '../api/shop'
import type { AdminProduct } from '../api/types'
import { ConfirmModal } from '../components/ConfirmModal'
import { ProductPic } from '../components/ProductPic'
import { money } from '../lib/format'
import { useToast } from '../state/toast'
import { AddProductPanel } from './AddProductPanel'
import { EditProductModal } from './EditProductModal'
import { StockModal } from './StockModal'

const STOCK_TEXT = { OUT_OF_STOCK: 'Out of stock', LOW_STOCK: 'Low stock', IN_SHOP: 'in stock', HIDDEN: 'in stock' } as const

/** Admin > Products. */
export function ProductsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const products = useQuery({ queryKey: ['admin', 'products'], queryFn: getAdminProducts })
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 5 * 60_000 })
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [stockFor, setStockFor] = useState<AdminProduct | null>(null)
  const [removing, setRemoving] = useState<AdminProduct | null>(null)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
    void queryClient.invalidateQueries({ queryKey: ['products'] })
  }
  const toggle = useMutation({
    mutationFn: (p: AdminProduct) => updateProduct(p.id, {
      name: p.name, categoryId: p.categoryId, unit: p.unit, price: p.price, mrp: p.mrp, icon: p.icon, active: !p.active,
    }),
    onSuccess: (p) => { toast(p.active ? `${p.name} is live in the shop` : `${p.name} is hidden from the shop`); refresh() },
    onError: (e) => toast(e.message),
  })
  const remove = useMutation({
    mutationFn: (p: AdminProduct) => removeProduct(p.id),
    onSuccess: () => { toast(`${removing?.name ?? 'Product'} removed`); setRemoving(null); refresh() },
  })

  const list = products.data ?? []
  return (
    <>
      <h1>Products</h1>
      <AddProductPanel categories={categories.data ?? []} />
      <div className="section-h">
        <h2>Products in store</h2>
        <span className="muted small">{list.length} products, low stock first</span>
      </div>
      {products.isLoading ? (
        <div className="skeleton" />
      ) : products.isError ? (
        <div className="empty panel"><h3>Couldn’t load products</h3><p>{products.error.message}</p></div>
      ) : list.length === 0 ? (
        <div className="empty panel"><div className="big">📦</div><h3>No products yet</h3><p>Add your first product above.</p></div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Shop status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={p.stockQty <= 5 ? 'lowrow' : ''}>
                  <td>
                    <div className="pcell">
                      <span className="em" aria-hidden="true"><ProductPic imageUrl={p.imageUrl} icon={p.icon} /></span>
                      <div><b>{p.name}</b><span>{p.unit}</span></div>
                    </div>
                  </td>
                  <td>{p.categoryName}</td>
                  <td>
                    <b>{money(p.price)}</b>
                    {p.mrp > p.price ? <> <s className="muted small">{money(p.mrp)}</s><div className="small" style={{ color: 'var(--info)', fontWeight: 600 }}>{p.discountPercent}% off</div></> : null}
                    <div><button type="button" className="linkbtn small" onClick={() => setEditing(p)}>Change price</button></div>
                  </td>
                  <td>
                    <div className="stockcell">
                      <b className="stocknum">{p.stockQty}</b>
                      <span className={`small ${p.stockQty <= 0 ? 'negtxt' : p.stockQty <= 5 ? 'lowtxt' : 'muted'}`}>{STOCK_TEXT[p.status]}</span>
                    </div>
                    <button type="button" className="ghost updbtn" onClick={() => setStockFor(p)} aria-label={`Update stock for ${p.name}`}>Update stock</button>
                  </td>
                  <td>
                    <button type="button" className={`toggle ${p.active ? 'on' : 'offp'}`} aria-pressed={p.active}
                            onClick={() => toggle.mutate(p)} disabled={toggle.isPending} aria-label={`${p.name}: ${p.active ? 'Live in shop' : 'Hidden'}. Click to change`}>
                      {p.active ? 'Live in shop' : 'Hidden'}
                    </button>
                    {p.active && p.stockQty <= 0 ? <div className="small muted" style={{ marginTop: 4 }}>Not shown until restocked</div> : null}
                  </td>
                  <td>
                    <div className="rowact">
                      <button type="button" className="ghost" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>Edit</button>
                      <button type="button" className="iconbtn" onClick={() => setRemoving(p)} aria-label={`Remove ${p.name}`}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing ? <EditProductModal product={editing} categories={categories.data ?? []} onClose={() => setEditing(null)} /> : null}
      {stockFor ? <StockModal product={stockFor} onClose={() => setStockFor(null)} /> : null}
      {removing ? (
        <ConfirmModal title={`Remove ${removing.name}?`} text="It will no longer appear in the shop. Past orders keep their details."
                      confirmLabel="Remove product" busy={remove.isPending} error={remove.error?.message}
                      onConfirm={() => remove.mutate(removing)} onClose={() => setRemoving(null)} />
      ) : null}
    </>
  )
}
