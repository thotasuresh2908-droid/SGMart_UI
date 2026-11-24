import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import { partners, paymentReport, stockReport } from '../test/fixtures'
import { renderApp } from '../test/render'
import { PartnersPage } from './PartnersPage'
import { PaymentsPage } from './PaymentsPage'
import { StockPage } from './StockPage'

vi.mock('../api/admin', () => ({
  getStockReport: vi.fn(), getPaymentReport: vi.fn(), getPartners: vi.fn(), createPartner: vi.fn(),
  updatePartner: vi.fn(), setPartnerStatus: vi.fn(), updateStock: vi.fn(),
}))

describe("Today's stock", () => {
  beforeEach(() => vi.mocked(admin.getStockReport).mockResolvedValue(stockReport))

  it('shows tiles, stock by product, the restock log and deliveries by partner', async () => {
    renderApp(<StockPage />)
    expect(await screen.findByText('+30')).toBeInTheDocument()
    expect(screen.getByText('Out of stock, not in shop')).toBeInTheDocument()
    expect(screen.getByText('Stock received')).toBeInTheDocument()
    expect(screen.getByText('Basmati Rice ×2, Toned Milk ×3')).toBeInTheDocument()
    expect(screen.getByText('11 min')).toBeInTheDocument()
  })

  it('filters to low stock and opens Update stock with the current number', async () => {
    renderApp(<StockPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Low stock (1)' }))
    expect(screen.queryByText('Fresh Paneer')).not.toBeInTheDocument()   // out of stock, not low
    expect(screen.getByText('Low stock, in shop')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Update stock for Green Tea' }))
    expect(within(screen.getByRole('dialog')).getByText('3')).toBeInTheDocument()
  })
})

describe('Payments', () => {
  beforeEach(() => vi.mocked(admin.getPaymentReport).mockResolvedValue(paymentReport))

  it('shows totals, cash each partner must hand over, still to collect and records', async () => {
    renderApp(<PaymentsPage />)
    expect(await screen.findByText('₹543')).toBeInTheDocument()
    expect(screen.getByText('₹126')).toBeInTheDocument()
    expect(screen.getByText(/On the way now: #SG1004, ₹200/)).toBeInTheDocument()
    expect(screen.getByText('Not assigned yet')).toBeInTheDocument()
    expect(screen.getByText('Ref 4821 9930 7712')).toBeInTheDocument()
  })

  it('All time asks the backend for everything', async () => {
    renderApp(<PaymentsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'All time' }))
    await waitFor(() => expect(admin.getPaymentReport).toHaveBeenLastCalledWith({ all: true, date: null }))
  })
})

describe('Delivery partners', () => {
  beforeEach(() => vi.mocked(admin.getPartners).mockResolvedValue(partners))

  it('available and off-duty partners can be switched; partners on a delivery cannot', async () => {
    vi.mocked(admin.setPartnerStatus).mockResolvedValue({ ...partners[0], status: 'OFF_DUTY' })
    renderApp(<PartnersPage />)
    const ravi = (await screen.findByText('Ravi Kumar')).closest('.pcard') as HTMLElement
    const salma = screen.getByText('Salma Begum').closest('.pcard') as HTMLElement
    expect(within(salma).queryByRole('button', { name: /Mark as/ })).not.toBeInTheDocument()
    expect(within(salma).getByText(/Now delivering #SG1004/)).toBeInTheDocument()
    await userEvent.click(within(ravi).getByRole('button', { name: 'Mark as off duty' }))
    await waitFor(() => expect(admin.setPartnerStatus).toHaveBeenCalledWith(1, 'OFF_DUTY'))
  })

  it('adds a partner after checking the mobile number', async () => {
    vi.mocked(admin.createPartner).mockResolvedValue({ ...partners[0], id: 4, name: 'Kiran Rao' })
    renderApp(<PartnersPage />)
    const form = await screen.findByRole('form', { name: 'Add a delivery partner' })
    await userEvent.type(within(form).getByLabelText(/Full name/), 'Kiran Rao')
    await userEvent.type(within(form).getByLabelText(/Mobile number/), '12345')
    await userEvent.click(within(form).getByRole('button', { name: 'Add partner' }))
    expect(within(form).getByText('Enter a valid 10-digit mobile number.')).toBeInTheDocument()
    await userEvent.clear(within(form).getByLabelText(/Mobile number/))
    await userEvent.type(within(form).getByLabelText(/Mobile number/), '90000 11111')
    await userEvent.selectOptions(within(form).getByLabelText('Vehicle'), 'SCOOTER')
    await userEvent.click(within(form).getByRole('button', { name: 'Add partner' }))
    await waitFor(() => expect(admin.createPartner).toHaveBeenCalledWith({ name: 'Kiran Rao', mobile: '90000 11111', vehicleType: 'SCOOTER' }))
  })
})
