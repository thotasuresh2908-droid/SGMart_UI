import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import { renderApp } from '../test/render'
import { StockModal } from './StockModal'

vi.mock('../api/admin', () => ({ updateStock: vi.fn() }))
const tea = { id: 9, name: 'Green Tea', unit: '25 bags', icon: '🍵', imageUrl: null, stockQty: 3 }

describe('Update stock window', () => {
  beforeEach(() => vi.mocked(admin.updateStock).mockResolvedValue({ productId: 9, productName: 'Green Tea', stockBefore: 3, stockAfter: 13, changed: true, status: 'IN_SHOP' }))

  it('adds received stock with quick buttons and shows 3 → 13', async () => {
    renderApp(<StockModal product={tea} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: '+10' }))
    expect(screen.getByText('3 → 13')).toBeInTheDocument()
    expect(screen.getByText('Shown in the shop.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save stock' }))
    await waitFor(() => expect(admin.updateStock).toHaveBeenCalledWith(9, { mode: 'ADD', qty: 10 }))
  })

  it('sets an exact count with a reason and warns when it hides the product', async () => {
    renderApp(<StockModal product={tea} onClose={() => {}} />)
    await userEvent.click(screen.getByLabelText('Set exact count'))
    await userEvent.type(screen.getByLabelText('How many are in the store right now?'), '0')
    await userEvent.selectOptions(screen.getByLabelText('Reason'), 'DAMAGED')
    expect(screen.getByText('The product will be hidden from customers.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save stock' }))
    await waitFor(() => expect(admin.updateStock).toHaveBeenCalledWith(9, { mode: 'SET', qty: 0, reason: 'DAMAGED' }))
  })

  it('adding nothing is refused before sending', async () => {
    renderApp(<StockModal product={tea} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save stock' }))
    expect(screen.getByText('Enter how many units you received.')).toBeInTheDocument()
    expect(admin.updateStock).not.toHaveBeenCalled()
  })
})
