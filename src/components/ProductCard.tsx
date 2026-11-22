import type { ShopProduct } from '../api/types'
import { money } from '../lib/format'
import { useCart } from '../state/cart'
import { ProductPic } from './ProductPic'
import { Stepper } from './Stepper'

export function ProductCard({ product, etaMinutes }: { product: ShopProduct; etaMinutes: number }) {
  const cart = useCart()
  const qty = cart.qtyOf(product.id)
  return (
    <article className="card">
      {product.discountPercent ? <span className="off">{product.discountPercent}% off</span> : null}
      <div className="pic" aria-hidden="true">
        <ProductPic imageUrl={product.imageUrl} icon={product.icon} />
      </div>
      <span className="eta">⏱ {etaMinutes} min</span>
      <h3>{product.name}</h3>
      <p className="unit">{product.unit}</p>
      <div className="buy">
        <div className="price">
          <b>{money(product.price)}</b>
          {product.mrp > product.price ? <s>{money(product.mrp)}</s> : null}
        </div>
        {qty > 0 ? (
          <Stepper qty={qty} name={product.name} onAdd={() => cart.add(product)} onRemove={() => cart.remove(product.id)} />
        ) : (
          <button type="button" className="add" onClick={() => cart.add(product)} aria-label={`Add ${product.name}`}>
            Add
          </button>
        )}
      </div>
      {product.lowStock ? <p className="low">Only {product.stockLeft} left</p> : null}
    </article>
  )
}
