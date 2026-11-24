import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import * as shop from '../api/shop'
import { customer, store } from '../test/fixtures'
import { renderApp } from '../test/render'
import { SettingsPage } from './SettingsPage'

vi.mock('../api/admin', () => ({
  updateStore: vi.fn(), getAdminUsers: vi.fn().mockResolvedValue([]), addAdminUser: vi.fn(), updateAdminUser: vi.fn(),
  getBlockedCustomers: vi.fn(), unblockCustomer: vi.fn(),
}))
vi.mock('../api/shop', () => ({ getSession: vi.fn(), getStore: vi.fn() }))

const as = (role: 'OWNER' | 'MANAGER') => {
  vi.mocked(shop.getSession).mockResolvedValue({ type: 'ADMIN', id: 1, name: 'Admin', email: 'a@gmail.com', role })
  vi.mocked(shop.getStore).mockResolvedValue(store)
}

describe('Admin > Settings', () => {
  it('the owner changes the delivery fee rule and removes the first-order limit', async () => {
    as('OWNER')
    vi.mocked(admin.updateStore).mockResolvedValue({ ...store, deliveryFee: 30, freeDeliveryMin: 299, firstOrderCodLimit: null })
    renderApp(<SettingsPage />)
    const fee = await screen.findByLabelText('Delivery fee (₹)')
    await userEvent.clear(fee); await userEvent.type(fee, '30')
    const free = screen.getByLabelText('Free delivery from (₹)')
    await userEvent.clear(free); await userEvent.type(free, '299')
    await userEvent.clear(screen.getByLabelText(/First-order limit/))
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(admin.updateStore).toHaveBeenCalledWith({
      storeName: 'SGMart', phone: '9000012345', opensAt: '07:00', closesAt: '23:00', etaMinutes: 10,
      deliveryFee: 30, freeDeliveryMin: 299, firstOrderCodLimit: null,
    }))
  })

  it('wrong values are caught before saving', async () => {
    as('OWNER')
    renderApp(<SettingsPage />)
    const closes = await screen.findByLabelText('Closes at')
    await userEvent.clear(closes); await userEvent.type(closes, '07:00')
    await userEvent.clear(screen.getByLabelText(/Store phone/)); await userEvent.type(screen.getByLabelText(/Store phone/), '12345')
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(screen.getByText('Opening and closing times can’t be the same.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid 10-digit mobile number.')).toBeInTheDocument()
    expect(admin.updateStore).not.toHaveBeenCalled()
  })

  it('a manager sees store settings read-only and no Admin users tab', async () => {
    as('MANAGER')
    renderApp(<SettingsPage />)
    expect(await screen.findByText('Only the store owner can change these settings.')).toBeInTheDocument()
    expect(screen.getByLabelText('Delivery fee (₹)')).toBeDisabled()
    expect(screen.queryByRole('tab', { name: 'Admin users' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save settings' })).not.toBeInTheDocument()
  })

  it('the block list can unblock a number', async () => {
    as('MANAGER')
    vi.mocked(admin.getBlockedCustomers).mockResolvedValue([customer({ id: 5, name: 'Prank Caller', mobile: '9000000009', blocked: true, blockedReason: 'Fake or prank order', blockedAt: '2026-11-10T05:00:00Z' })])
    vi.mocked(admin.unblockCustomer).mockResolvedValue(customer({ id: 5, blocked: false, mobile: '9000000009' }))
    renderApp(<SettingsPage />, ['/?tab=blocked'])
    expect(await screen.findByText('Fake or prank order')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Unblock' }))
    await waitFor(() => expect(admin.unblockCustomer).toHaveBeenCalledWith(5))
  })
})
