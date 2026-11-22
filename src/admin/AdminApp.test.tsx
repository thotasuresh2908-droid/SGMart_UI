import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router'
import * as shop from '../api/shop'
import { renderApp } from '../test/render'
import AdminApp from './AdminApp'

vi.mock('../api/shop', () => ({ getSession: vi.fn(), getStore: vi.fn(), logout: vi.fn() }))
vi.mock('../api/admin', () => ({
  getAdminMe: vi.fn().mockResolvedValue({ id: 1, email: 'owner@gmail.com', name: 'Store Owner', role: 'OWNER', active: true, lastLoginAt: null }),
  getOrderCounts: vi.fn().mockResolvedValue({ newOrders: 2, accepted: 1, outForDelivery: 1, deliveredToday: 2, deliveredSalesToday: 434, rejectedToday: 0, cancelledToday: 0 }),
  getAdminOrders: vi.fn().mockResolvedValue({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 }),
  getPartners: vi.fn().mockResolvedValue([]),
  signInAdminWithGoogle: vi.fn(),
}))

const at = (path: string) => renderApp(<Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>, [path])

describe('Admin access', () => {
  beforeEach(() => {
    vi.mocked(shop.getStore).mockResolvedValue({ storeName: 'SGMart', phone: '9000012345', opensAt: '07:00:00', closesAt: '23:00:00', openNow: true, etaMinutes: 10, deliveryFee: 25, freeDeliveryMin: 199, firstOrderCodLimit: 1000 })
  })

  it('sends people who are not signed in to the admin sign-in page', async () => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'GUEST', id: null, name: null, email: null, role: null })
    at('/admin/orders')
    expect(await screen.findByRole('heading', { name: 'Store admin sign in' })).toBeInTheDocument()
  })

  it('explains when a Google account has no admin access', async () => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'GUEST', id: null, name: null, email: null, role: null })
    at('/admin/login?error=no_access')
    expect(await screen.findByRole('alert')).toHaveTextContent("This Google account doesn't have admin access.")
  })

  it('shows the order screen with counts to a signed-in admin', async () => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'ADMIN', id: 1, name: 'Store Owner', email: 'owner@gmail.com', role: 'OWNER' })
    at('/admin')
    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(await screen.findByText('₹434')).toBeInTheDocument()
    expect(screen.getByText('No orders here')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Orders/ })).toHaveTextContent('2')
    expect(screen.getByText('Open, 7 am to 11 pm')).toBeInTheDocument()
  })
})
