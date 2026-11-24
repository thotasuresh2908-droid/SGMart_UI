import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { removeProductImage, updateProduct, uploadProductImage } from '../api/admin'
import type { AdminProduct, Category } from '../api/types'
import { Modal } from '../components/Modal'
import { money } from '../lib/format'
import { useToast } from '../state/toast'
import { PhotoPicker, type PhotoChoice } from './PhotoPicker'
import { ProductFields } from './ProductFields'
import { validateProduct, type ProductErrors, type ProductValues } from './productRules'

/** "Edit product": name, pack size, category, price, MRP, icon, photo. New prices apply to new orders only. */
export function EditProductModal({ product, categories, onClose }: { product: AdminProduct; categories: Category[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [values, setValues] = useState<ProductValues>({
    name: product.name, categoryId: String(product.categoryId), unit: product.unit, price: String(product.price),
    mrp: product.mrp > product.price ? String(product.mrp) : '', stockQty: '', icon: product.icon,
  })
  const [errors, setErrors] = useState<ProductErrors>({})
  const [photo, setPhoto] = useState<PhotoChoice>({ kind: 'keep' })

  const mutation = useMutation({
    mutationFn: async () => {
      const saved = await updateProduct(product.id, {
        name: values.name.trim(), categoryId: Number(values.categoryId), unit: values.unit.trim(),
        price: Number(values.price), mrp: values.mrp.trim() ? Number(values.mrp) : null, icon: values.icon, active: product.active,
      })
      if (photo.kind === 'new') return uploadProductImage(product.id, photo.blob)
      if (photo.kind === 'remove' && product.imageUrl) return removeProductImage(product.id)
      return saved
    },
    onSuccess: (saved) => {
      toast(saved.price !== product.price
        ? `${saved.name} price changed from ${money(product.price)} to ${money(saved.price)}`
        : `${saved.name} updated`)
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateProduct(values, false)
    setErrors(found)
    if (Object.keys(found).length === 0) mutation.mutate()
  }

  return (
    <Modal title="Edit product" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="field">
          <span className="flabel">Product photo</span>
          <PhotoPicker currentUrl={product.imageUrl} icon={values.icon} choice={photo} onChange={setPhoto} inputId="edit-photo" />
        </div>
        <div className="fgrid modalgrid">
          <ProductFields values={values} errors={errors} onChange={(p) => setValues((v) => ({ ...v, ...p }))}
                         categories={categories} withStock={false} oldPrice={product.price} idPrefix="edit" />
        </div>
        <p className="small muted">A new price applies to new orders. Orders already placed keep the price they were placed at.</p>
        {mutation.error ? <p className="errorbox" role="alert">{mutation.error.message}</p> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
          <button className="primary wide" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}
