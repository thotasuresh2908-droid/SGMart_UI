import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { placeOrder } from '../api/shop'
import { ApiError } from '../api/client'
import type { PlacedOrder, StoreInfo } from '../api/types'
import { money } from '../lib/format'
import { saveOrder } from '../lib/savedOrders'
import { readJson, writeJson } from '../lib/storage'
import { useCart } from '../state/cart'
import { deliveryFee } from '../state/cartLogic'
import { useDeliveryLocation } from '../state/location'
import { useProfile, useSession } from '../state/session'
import { checkoutSchema, type CheckoutValues } from './checkoutSchema'
import { captchaEnabled } from './captcha'
import { Turnstile } from './Turnstile'

const DETAILS_KEY = 'sgmart.checkout'
type SavedDetails = Partial<Pick<CheckoutValues, 'customerName' | 'mobile' | 'addressLine' | 'landmark'>>

/** Server field names that map onto form fields, so the message shows under the right box. */
const FIELDS = ['customerName', 'mobile', 'addressLine', 'landmark'] as const

export function CheckoutForm({ store, onPlaced }: { store: StoreInfo | undefined; onPlaced: (placed: PlacedOrder) => void }) {
  const cart = useCart()
  const queryClient = useQueryClient()
  const session = useSession().data
  const profile = useProfile(session?.type === 'CUSTOMER').data
  const { location, detect, detecting, error: locationError } = useDeliveryLocation()
  const saved = readJson<SavedDetails>(DETAILS_KEY, {})
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaReset, setCaptchaReset] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)

  const { register, handleSubmit, setError, setValue, getValues, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: saved.customerName ?? '',
      mobile: saved.mobile ?? '',
      addressLine: saved.addressLine ?? '',
      landmark: saved.landmark ?? '',
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  })

  // Signed-in shoppers: fill in their name and mobile if the boxes are empty.
  useEffect(() => {
    if (!profile) return
    if (!getValues('customerName')) setValue('customerName', profile.name)
    if (!getValues('mobile') && profile.mobile) setValue('mobile', profile.mobile)
  }, [profile, getValues, setValue])

  // Like the prototype: try to detect the location when checkout opens.
  useEffect(() => {
    if (!location) void detect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fee = deliveryFee(cart.total, store)
  const mutation = useMutation({
    mutationFn: (values: CheckoutValues) =>
      placeOrder({
        ...values,
        landmark: values.landmark || undefined,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        items: cart.lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
        captchaToken,
      }),
    onSuccess: (placed, values) => {
      saveOrder({ orderNo: placed.orderNo, token: placed.trackingToken, placedAt: placed.order.placedAt })
      writeJson(DETAILS_KEY, { customerName: values.customerName, mobile: values.mobile, addressLine: values.addressLine, landmark: values.landmark })
      cart.clear()
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      onPlaced(placed)
    },
    onError: (err) => {
      const e = err instanceof ApiError ? err : null
      const field = FIELDS.find((f) => f === e?.field)
      if (e && field) {
        setError(field, { message: e.message })
        return
      }
      if (e?.code === 'STOCK_NOT_ENOUGH' || e?.code === 'PRODUCT_UNAVAILABLE') {
        void queryClient.invalidateQueries({ queryKey: ['products'] })
      }
      if (e?.code === 'CAPTCHA_FAILED') setCaptchaReset((n) => n + 1)
      setProblem(e?.message ?? 'Something went wrong. Please try again.')
    },
  })

  const submit = handleSubmit((values) => {
    setProblem(null)
    if (captchaEnabled && !captchaToken) {
      setProblem('Please complete the "I\'m not a robot" check.')
      return
    }
    mutation.mutate(values)
  })

  const fieldClass = (name: keyof CheckoutValues) => `field${errors[name] ? ' bad' : ''}`
  return (
    <>
      <form id="checkout" className="dbody" onSubmit={submit} noValidate>
        <div className="box">
          {location?.lat != null ? (
            <div className="locok">
              <span className="pin" aria-hidden="true">📍</span>
              <div>
                <b>Location detected</b>
                <p>{location.lat.toFixed(5)}, {location.lng?.toFixed(5)}. The delivery partner will see this pin.</p>
              </div>
              <button type="button" className="linkbtn small" onClick={() => void detect()}>Refresh</button>
            </div>
          ) : (
            <>
              <button type="button" className="detect" onClick={() => void detect()} disabled={detecting}>
                {detecting ? 'Detecting your location…' : '📍 Detect my current location'}
              </button>
              <p className="small muted" style={{ marginTop: 8 }}>
                {locationError ?? 'We use your location to guide the delivery partner to your door.'}
              </p>
            </>
          )}
        </div>

        <div className={fieldClass('customerName')}>
          <label htmlFor="customerName">Full name <i>*</i></label>
          <input id="customerName" autoComplete="name" placeholder="e.g. Priya Sharma" {...register('customerName')} />
          <p className="err">{errors.customerName?.message}</p>
        </div>
        <div className={fieldClass('mobile')}>
          <label htmlFor="mobile">Mobile number <i>*</i></label>
          <input id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" {...register('mobile')} />
          <p className="err">{errors.mobile?.message}</p>
        </div>
        <div className={fieldClass('addressLine')}>
          <label htmlFor="addressLine">Delivery address <i>*</i></label>
          <textarea id="addressLine" rows={3} autoComplete="street-address" placeholder="House or flat number, building, street, area" {...register('addressLine')} />
          <p className="err">{errors.addressLine?.message}</p>
        </div>
        <div className={fieldClass('landmark')}>
          <label htmlFor="landmark">Landmark <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <input id="landmark" placeholder="e.g. Near the temple" {...register('landmark')} />
          <p className="err">{errors.landmark?.message}</p>
        </div>
        <fieldset className="pay">
          <legend>Payment</legend>
          <label><input type="radio" value="CASH_ON_DELIVERY" {...register('paymentMethod')} /> Cash on delivery</label>
          <label><input type="radio" value="UPI_ON_DELIVERY" {...register('paymentMethod')} /> UPI on delivery</label>
        </fieldset>

        <div className="box bill">
          <h3>Bill details</h3>
          <div className="row"><span>Item total</span><span>{money(cart.total)}</span></div>
          <div className="row"><span>Delivery fee</span><span>{fee ? money(fee) : 'Free'}</span></div>
          <div className="row grand"><span>To pay</span><span>{money(cart.total + fee)}</span></div>
        </div>
        <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
        {problem ? <p className="errorbox" role="alert">{problem}</p> : null}
      </form>
      <div className="dfoot">
        <button className="primary wide" type="submit" form="checkout" disabled={mutation.isPending || cart.count === 0}>
          {mutation.isPending ? 'Placing your order…' : `Place order, ${money(cart.total + fee)}`}
        </button>
      </div>
    </>
  )
}
