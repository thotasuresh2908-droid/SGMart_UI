import type { Category } from '../api/types'
import { ICONS, pricePreview, type ProductErrors, type ProductValues } from './productRules'

interface Props {
  values: ProductValues
  errors: ProductErrors
  onChange: (patch: Partial<ProductValues>) => void
  categories: Category[]
  withStock: boolean
  oldPrice?: number
  idPrefix: string
}

/** The product boxes shared by "Add a product" and "Edit product", with the live price preview. */
export function ProductFields({ values, errors, onChange, categories, withStock, oldPrice, idPrefix }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`
  const preview = pricePreview(values.price, values.mrp, oldPrice)
  const field = (name: keyof ProductValues, extra = '') => `field${errors[name] ? ' bad' : ''}${extra}`
  return (
    <>
      <div className={field('name', ' span2')}>
        <label htmlFor={id('name')}>Product name <i>*</i></label>
        <input id={id('name')} maxLength={120} placeholder="e.g. Curd" value={values.name} onChange={(e) => onChange({ name: e.target.value })} />
        <p className="err">{errors.name}</p>
      </div>
      <div className={field('categoryId')}>
        <label htmlFor={id('category')}>Category <i>*</i></label>
        <select id={id('category')} value={values.categoryId} onChange={(e) => onChange({ categoryId: e.target.value })}>
          <option value="">Choose a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <p className="err">{errors.categoryId}</p>
      </div>
      <div className={field('unit')}>
        <label htmlFor={id('unit')}>Pack size <i>*</i></label>
        <input id={id('unit')} maxLength={40} placeholder="e.g. 400 g" value={values.unit} onChange={(e) => onChange({ unit: e.target.value })} />
        <p className="err">{errors.unit}</p>
      </div>
      <div className={field('price')}>
        <label htmlFor={id('price')}>Selling price (₹) <i>*</i></label>
        <input id={id('price')} inputMode="decimal" placeholder="e.g. 35" value={values.price} onChange={(e) => onChange({ price: e.target.value })} />
        <p className="err">{errors.price}</p>
      </div>
      <div className={field('mrp')}>
        <label htmlFor={id('mrp')}>MRP (₹) <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
        <input id={id('mrp')} inputMode="decimal" placeholder="e.g. 40" value={values.mrp} onChange={(e) => onChange({ mrp: e.target.value })} />
        <p className="err">{errors.mrp}</p>
      </div>
      {withStock ? (
        <div className={field('stockQty')}>
          <label htmlFor={id('stock')}>Quantity in stock <i>*</i></label>
          <input id={id('stock')} inputMode="numeric" placeholder="e.g. 25" value={values.stockQty} onChange={(e) => onChange({ stockQty: e.target.value.replace(/\D/g, '') })} />
          <p className="err">{errors.stockQty}</p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor={id('icon')}>Icon (shown when there’s no photo)</label>
        <select id={id('icon')} value={values.icon} onChange={(e) => onChange({ icon: e.target.value })}>
          {(ICONS.includes(values.icon) ? ICONS : [values.icon, ...ICONS]).map((i) => <option key={i}>{i}</option>)}
        </select>
      </div>
      <div className="price-prev span3" aria-live="polite">
        {preview ? (
          <>
            Customers will see <b>{preview.price}</b>
            {preview.mrp ? <> <s className="muted">{preview.mrp}</s> <span style={{ color: 'var(--info)', fontWeight: 600 }}>{preview.off}% off</span></> : null}
            {preview.change ? <><br /><span className="small">{preview.change}</span></> : null}
          </>
        ) : (
          <span className="muted">Enter a selling price to see how customers will see it.</span>
        )}
      </div>
    </>
  )
}
