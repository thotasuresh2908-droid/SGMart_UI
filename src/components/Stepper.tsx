interface Props {
  qty: number
  onAdd: () => void
  onRemove: () => void
  name: string
}

/** − 2 + control used on product cards and in the cart. */
export function Stepper({ qty, onAdd, onRemove, name }: Props) {
  return (
    <div className="stepper">
      <button type="button" onClick={onRemove} aria-label={`Remove one ${name}`}>−</button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={onAdd} aria-label={`Add one ${name}`}>+</button>
    </div>
  )
}
