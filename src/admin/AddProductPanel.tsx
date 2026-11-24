import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createProduct, uploadProductImage } from '../api/admin'
import type { Category } from '../api/types'
import { useToast } from '../state/toast'
import { PhotoPicker, type PhotoChoice } from './PhotoPicker'
import { ProductFields } from './ProductFields'
import { validateProduct, type ProductErrors, type ProductValues } from './productRules'

const EMPTY: ProductValues = { name: '', categoryId: '', unit: '', price: '', mrp: '', stockQty: '', icon: '🛒' }

/** "Add a product": goes live in the shop straight away if it has stock. */
export function AddProductPanel({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [values, setValues] = useState<ProductValues>(EMPTY)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [photo, setPhoto] = useState<PhotoChoice>({ kind: 'keep' })

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await createProduct({
        name: values.name.trim(), categoryId: Number(values.categoryId), unit: values.unit.trim(),
        price: Number(values.price), mrp: values.mrp.trim() ? Number(values.mrp) : null,
        stockQty: Number(values.stockQty), icon: values.icon,
      })
      return photo.kind === 'new' ? uploadProductImage(created.id, photo.blob) : created
    },
    onSuccess: (p) => {
      toast(p.stockQty > 0 ? `${p.name} added. It’s now live in the shop.` : `${p.name} added. Add stock to show it in the shop.`)
      setValues(EMPTY)
      setPhoto({ kind: 'keep' })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateProduct(values, true)
    setErrors(found)
    if (Object.keys(found).length === 0) mutation.mutate()
  }

  return (
    <form className="panel" onSubmit={submit} noValidate aria-label="Add a product">
      <h2>Add a product</h2>
      <div className="fgrid">
        <ProductFields values={values} errors={errors} onChange={(p) => setValues((v) => ({ ...v, ...p }))}
                       categories={categories} withStock idPrefix="add" />
        <div className="field span3">
          <span className="flabel">Product photo <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></span>
          <PhotoPicker currentUrl={null} icon="📷" choice={photo} onChange={setPhoto} inputId="add-photo" />
        </div>
        <div className="actions span3">
          <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Adding…' : 'Add product'}</button>
        </div>
      </div>
      {mutation.error ? <p className="errorbox" role="alert" style={{ marginTop: 10 }}>{mutation.error.message}</p> : null}
    </form>
  )
}
