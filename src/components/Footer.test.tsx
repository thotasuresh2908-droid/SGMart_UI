import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as shop from '../api/shop'
import { store } from '../test/fixtures'
import { renderApp } from '../test/render'
import { Footer } from './Footer'
import { LoginModal } from './LoginModal'

vi.mock('../api/shop', () => ({ getStore: vi.fn(), getSession: vi.fn(), getProfile: vi.fn(), continueWithGoogle: vi.fn(), logout: vi.fn(), updateProfile: vi.fn() }))

describe('Staff entry to the admin panel', () => {
  it('the shop footer links to the admin sign-in and shows the store phone', async () => {
    vi.mocked(shop.getStore).mockResolvedValue(store)
    renderApp(<Footer />)
    expect(screen.getByRole('link', { name: 'Store admin sign in' })).toHaveAttribute('href', '/admin/login')
    expect(await screen.findByRole('link', { name: /90000 12345/ })).toHaveAttribute('href', 'tel:9000012345')
  })

  it('the Log in window offers a staff sign-in link', async () => {
    vi.mocked(shop.getSession).mockResolvedValue({ type: 'GUEST', id: null, name: null, email: null, role: null })
    renderApp(<LoginModal onClose={() => {}} />)
    expect(await screen.findByRole('link', { name: 'Sign in to Admin' })).toHaveAttribute('href', '/admin/login')
  })
})
