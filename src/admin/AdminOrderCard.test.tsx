import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import { ApiError } from '../api/client'
import * as shop from '../api/shop'
import { adminOrder, partners, store } from '../test/fixtures'
import { renderApp } from '../test/render'
import { AdminOrderCard } from './AdminOrderCard'

vi.mock('../api/admin', () => ({
  acceptOrder: vi.fn(), rejectOrder: vi.fn(), dispatchOrder: vi.fn(), deliverOrder: vi.fn(), verifyCustomer: vi.fn(),
}))
vi.mock('../api/shop', () => ({ getStore: vi.fn() }))

const now = Date.parse('2026-11-12T03:05:00Z')
const card = (view = adminOrder(), list = partners) =>
  renderApp(<AdminOrderCard view={view} partners={list} adminName="Store Owner" now={now} />)

describe('AdminOrderCard', () => {
  beforeEach(() => {
    vi.mocked(shop.getStore).mockResolvedValue(store)
    vi.mocked(admin.acceptOrder).mockResolvedValue(adminOrder({ status: 'ACCEPTED' }))
  })

  it('accepts 2 of 3 items, showing the new total and sending the reason', async () => {
    card()
    expect(screen.getByText('New order')).toBeInTheDocument()
    const tea = screen.getByText(/1 × Green Tea/).closest('li')!
    await userEvent.click(within(tea).getByRole('button', { name: /Not available/ }))
    expect(await screen.findByText(/Accepting 2 of 3 items\. New total/)).toHaveTextContent('New total ₹126 (was ₹241)')
    await userEvent.selectOptions(within(tea).getByRole('combobox'), 'Expired')
    await userEvent.click(screen.getByRole('button', { name: 'Accept 2 of 3 items' }))
    await waitFor(() => expect(admin.acceptOrder).toHaveBeenCalledWith('SG1001', [{ itemId: 13, reason: 'Expired' }], false))
  })

  it('a new customer must be called before accepting', async () => {
    card(adminOrder({}, { newCustomer: true, mobileVerified: false, deliveredOrders: 0 }))
    expect(screen.getByText('New customer')).toBeInTheDocument()
    const accept = screen.getByRole('button', { name: 'Accept order' })
    expect(accept).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /I called/ }))
    await userEvent.click(accept)
    await waitFor(() => expect(admin.acceptOrder).toHaveBeenCalledWith('SG1001', [], true))
  })

  it('nothing available: only Reject is offered', async () => {
    card()
    for (const li of screen.getAllByRole('listitem').filter((l) => l.closest('.icheck'))) {
      await userEvent.click(within(li).getByRole('button', { name: /Not available/ }))
    }
    expect(screen.getByText(/None of the items are available/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Accept/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject order' })).toBeInTheDocument()
  })

  it('reject asks for a reason the customer will see', async () => {
    vi.mocked(admin.rejectOrder).mockResolvedValue(adminOrder({ status: 'REJECTED' }))
    card()
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await userEvent.click(screen.getByLabelText('Address is outside our delivery area'))
    await userEvent.click(screen.getByRole('button', { name: 'Reject order' }))
    await waitFor(() => expect(admin.rejectOrder).toHaveBeenCalledWith('SG1001', 'Address is outside our delivery area'))
  })

  it('accepted: only available partners can be chosen to send it out', async () => {
    vi.mocked(admin.dispatchOrder).mockResolvedValue(adminOrder({ status: 'OUT_FOR_DELIVERY' }))
    card(adminOrder({ status: 'ACCEPTED', acceptedAt: '2026-11-12T03:02:00Z' }))
    const select = screen.getByLabelText('Assign delivery partner')
    expect(within(select).queryByText(/Salma/)).not.toBeInTheDocument()
    expect(within(select).queryByText(/Arjun/)).not.toBeInTheDocument()
    const send = screen.getByRole('button', { name: 'Send out for delivery' })
    expect(send).toBeDisabled()
    await userEvent.selectOptions(select, '1')
    await userEvent.click(send)
    await waitFor(() => expect(admin.dispatchOrder).toHaveBeenCalledWith('SG1001', 1))
  })

  it('accepted with no free partner points to the partners screen', () => {
    card(adminOrder({ status: 'ACCEPTED' }), partners.filter((p) => p.status !== 'AVAILABLE'))
    expect(screen.getByText(/No delivery partners are available right now/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to delivery partners' })).toHaveAttribute('href', '/admin/partners')
  })

  it('mark delivered with UPI sends method, payer, collector and reference', async () => {
    vi.mocked(admin.deliverOrder).mockResolvedValue(adminOrder({ status: 'DELIVERED' }))
    card(adminOrder({ status: 'OUT_FOR_DELIVERY', paymentMethod: 'UPI_ON_DELIVERY',
      deliveryPartner: { id: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE' } }))
    expect(screen.getByRole('link', { name: /Call partner/ })).toHaveAttribute('href', 'tel:9848012345')
    await userEvent.click(screen.getByRole('button', { name: 'Mark as delivered' }))
    expect(within(screen.getByRole('dialog')).getByText('₹241')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/UPI transaction ID/), '4821 9930 7712')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delivered and paid' }))
    await waitFor(() => expect(admin.deliverOrder).toHaveBeenCalledWith('SG1001', {
      method: 'UPI', paidByName: 'Priya Sharma', collectedByPartnerId: 1, upiRef: '4821 9930 7712',
    }))
  })

  it('cash payment never sends a UPI reference', async () => {
    vi.mocked(admin.deliverOrder).mockResolvedValue(adminOrder({ status: 'DELIVERED' }))
    card(adminOrder({ status: 'OUT_FOR_DELIVERY', deliveryPartner: { id: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE' } }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark as delivered' }))
    expect(screen.queryByLabelText(/UPI transaction ID/)).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Collected by'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delivered and paid' }))
    await waitFor(() => expect(admin.deliverOrder).toHaveBeenCalledWith('SG1001', {
      method: 'CASH', paidByName: 'Priya Sharma', collectedByPartnerId: 2, upiRef: null,
    }))
  })

  it("shows the backend's message when someone else changed the order first", async () => {
    vi.mocked(admin.acceptOrder).mockRejectedValue(new ApiError(409, 'ORDER_CANCELLED', 'The customer cancelled this order.'))
    card()
    await userEvent.click(screen.getByRole('button', { name: 'Accept order' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The customer cancelled this order.')
  })

  it('delivered order shows the payment trail', () => {
    card(adminOrder({
      status: 'DELIVERED', deliveredAt: '2026-11-12T03:09:00Z', placedAt: '2026-11-12T03:00:00Z',
      deliveryPartner: { id: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE' },
      payment: { method: 'CASH', amount: 241, paidByName: 'Priya Sharma', collectedBy: 'Ravi Kumar', upiRef: null, confirmedBy: 'Store Owner', confirmedAt: '2026-11-12T03:09:00Z' },
    }))
    expect(screen.getByText('Paid ₹241 by cash')).toBeInTheDocument()
    expect(screen.getByText(/by Ravi Kumar, 9 min after ordering/)).toBeInTheDocument()
  })
})
