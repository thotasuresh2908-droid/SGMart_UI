import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import { ApiError } from '../api/client'
import * as shop from '../api/shop'
import { LoginModal } from '../components/LoginModal'
import { adminOrder, customer, partners, store } from '../test/fixtures'
import { renderApp } from '../test/render'
import { AdminOrderCard } from './AdminOrderCard'

vi.mock('../api/admin', () => ({
  acceptOrder: vi.fn(), rejectOrder: vi.fn(), dispatchOrder: vi.fn(), deliverOrder: vi.fn(), verifyCustomer: vi.fn(),
  blockCustomer: vi.fn(), unblockCustomer: vi.fn(),
}))
vi.mock('../api/shop', () => ({
  getStore: vi.fn(), getSession: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn(), logout: vi.fn(), continueWithGoogle: vi.fn(),
}))

describe('Block number on an order', () => {
  it('blocks with a reason from the order card', async () => {
    vi.mocked(shop.getStore).mockResolvedValue(store)
    vi.mocked(admin.blockCustomer).mockResolvedValue(customer({ blocked: true }))
    renderApp(<AdminOrderCard view={adminOrder()} partners={partners} adminName="Store Owner" now={Date.now()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Block number' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByLabelText('Fake or prank order'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Block number' }))
    await waitFor(() => expect(admin.blockCustomer).toHaveBeenCalledWith(9, 'Fake or prank order'))
  })

  it('a blocked customer shows the reason and can be unblocked', async () => {
    vi.mocked(shop.getStore).mockResolvedValue(store)
    vi.mocked(admin.unblockCustomer).mockResolvedValue(customer())
    renderApp(<AdminOrderCard view={adminOrder({}, { blocked: true, blockedReason: 'Refused delivery more than once' })} partners={partners} adminName="Store Owner" now={Date.now()} />)
    expect(screen.getByText('Blocked: Refused delivery more than once')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Unblock number' }))
    await waitFor(() => expect(admin.unblockCustomer).toHaveBeenCalledWith(9))
  })
})

describe('Customer: Edit details', () => {
  it('saves name and mobile, and shows the backend message under the mobile box', async () => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'CUSTOMER', id: 5, name: 'Priya', email: 'priya@gmail.com', role: null })
    vi.mocked(shop.getProfile).mockResolvedValue({ id: 5, name: 'Priya', email: 'priya@gmail.com', mobile: null, mobileVerified: false, deliveredOrders: 0 })
    vi.mocked(shop.updateProfile).mockRejectedValueOnce(new ApiError(409, 'MOBILE_IN_USE', 'This mobile number is linked to another Google account. Call the store if it’s your number.'))
    renderApp(<LoginModal onClose={() => {}} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit details' }))
    await userEvent.type(screen.getByLabelText('Mobile number'), '98765 43210')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/linked to another Google account/)).toBeInTheDocument()

    vi.mocked(shop.updateProfile).mockResolvedValueOnce({ id: 5, name: 'Priya Sharma', email: 'priya@gmail.com', mobile: '9876543210', mobileVerified: false, deliveredOrders: 0 })
    await userEvent.clear(screen.getByLabelText('Name'))
    await userEvent.type(screen.getByLabelText('Name'), 'Priya Sharma')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(shop.updateProfile).toHaveBeenLastCalledWith({ name: 'Priya Sharma', mobile: '98765 43210' }))
  })
})
