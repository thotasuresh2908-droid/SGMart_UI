import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as shop from '../api/shop'
import { order, product, store } from '../test/fixtures'
import { renderApp } from '../test/render'
import { useCart } from '../state/cart'
import { CheckoutForm } from './CheckoutForm'
import { useEffect } from 'react'

vi.mock('../api/shop', () => ({
  getSession: vi.fn(),
  getProfile: vi.fn(),
  getStore: vi.fn(),
  placeOrder: vi.fn(),
}))

/** Puts 2 × Toned Milk and 1 × Bread in the cart, then shows checkout. */
function CheckoutWithCart({ onPlaced }: { onPlaced: () => void }) {
  const cart = useCart()
  useEffect(() => {
    cart.add(product())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (cart.qtyOf(7) === 1) cart.add(product())
    if (cart.qtyOf(7) === 2 && cart.qtyOf(8) === 0) cart.add(product({ id: 8, name: 'Whole Wheat Bread', price: 45 }))
  }, [cart])
  return <CheckoutForm store={store} onPlaced={onPlaced} />
}

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'GUEST', id: null, name: null, email: null, role: null })
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true })
  })

  it('shows the required-field messages before sending anything', async () => {
    renderApp(<CheckoutWithCart onPlaced={() => {}} />)
    await userEvent.click(await screen.findByRole('button', { name: /Place order, ₹126/ }))
    expect(await screen.findByText('Enter the name of the person receiving the order.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid 10-digit mobile number.')).toBeInTheDocument()
    expect(screen.getByText('Enter your full address so the partner can find you.')).toBeInTheDocument()
    expect(shop.placeOrder).not.toHaveBeenCalled()
  })

  it('places the order, saves the tracking token and empties the cart', async () => {
    vi.mocked(shop.placeOrder).mockResolvedValue({ orderNo: 'SG1001', trackingToken: 'tok-123', order: order() })
    const onPlaced = vi.fn()
    renderApp(<CheckoutWithCart onPlaced={onPlaced} />)
    await userEvent.type(await screen.findByLabelText(/Full name/), 'Priya Sharma')
    await userEvent.type(screen.getByLabelText(/Mobile number/), '98765 43210')
    await userEvent.type(screen.getByLabelText(/Delivery address/), 'Flat 302, Green Residency, Road No. 12')
    await userEvent.click(screen.getByLabelText('UPI on delivery'))
    await userEvent.click(screen.getByRole('button', { name: /Place order, ₹126/ }))

    await waitFor(() => expect(onPlaced).toHaveBeenCalled())
    expect(vi.mocked(shop.placeOrder).mock.calls[0][0]).toMatchObject({
      customerName: 'Priya Sharma',
      mobile: '98765 43210',
      paymentMethod: 'UPI_ON_DELIVERY',
      items: [{ productId: 7, qty: 2 }, { productId: 8, qty: 1 }],
    })
    expect(JSON.parse(localStorage.getItem('sgmart.orders') ?? '[]')[0]).toMatchObject({ orderNo: 'SG1001', token: 'tok-123' })
    expect(JSON.parse(localStorage.getItem('sgmart.cart') ?? '{}')).toEqual({})
  })

  it("shows the store's reason when the order can't be placed", async () => {
    vi.mocked(shop.placeOrder).mockRejectedValue(new ApiError(400, 'FIRST_ORDER_LIMIT',
      'Your first order can be up to ₹1000. Remove a few items, or call the store on 9000012345 to order more.'))
    renderApp(<CheckoutWithCart onPlaced={() => {}} />)
    await userEvent.type(await screen.findByLabelText(/Full name/), 'Priya Sharma')
    await userEvent.type(screen.getByLabelText(/Mobile number/), '9876543210')
    await userEvent.type(screen.getByLabelText(/Delivery address/), 'Flat 302, Green Residency, Road No. 12')
    await userEvent.click(screen.getByRole('button', { name: /Place order/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Your first order can be up to ₹1000.')
  })

  it("puts the backend's field message under the right box", async () => {
    vi.mocked(shop.placeOrder).mockRejectedValue(new ApiError(400, 'INVALID_MOBILE', 'Enter a valid 10-digit mobile number.', 'mobile'))
    renderApp(<CheckoutWithCart onPlaced={() => {}} />)
    await userEvent.type(await screen.findByLabelText(/Full name/), 'Priya Sharma')
    await userEvent.type(screen.getByLabelText(/Mobile number/), '9876543210')
    await userEvent.type(screen.getByLabelText(/Delivery address/), 'Flat 302, Green Residency, Road No. 12')
    await userEvent.click(screen.getByRole('button', { name: /Place order/ }))
    expect(await screen.findByText('Enter a valid 10-digit mobile number.')).toBeInTheDocument()
  })
})
