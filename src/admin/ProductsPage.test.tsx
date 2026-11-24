import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as admin from '../api/admin'
import * as shop from '../api/shop'
import { adminProduct, categories } from '../test/fixtures'
import { renderApp } from '../test/render'
import { ProductsPage } from './ProductsPage'

vi.mock('../api/admin', () => ({
  getAdminProducts: vi.fn(), createProduct: vi.fn(), updateProduct: vi.fn(), removeProduct: vi.fn(),
  uploadProductImage: vi.fn(), removeProductImage: vi.fn(), updateStock: vi.fn(),
}))
vi.mock('../api/shop', () => ({ getCategories: vi.fn() }))

const tea = adminProduct()
const milk = adminProduct({ id: 7, categoryId: 2, categoryName: 'Dairy, bread & eggs', name: 'Toned Milk', unit: '500 ml', price: 28, mrp: 28, discountPercent: null, stockQty: 80, status: 'IN_SHOP', icon: '🥛' })

describe('Admin > Products', () => {
  beforeEach(() => {
    vi.mocked(admin.getAdminProducts).mockResolvedValue([tea, milk])
    vi.mocked(shop.getCategories).mockResolvedValue(categories)
  })

  it('lists products with price, discount, stock and status', async () => {
    renderApp(<ProductsPage />)
    const row = (await screen.findByText('Green Tea')).closest('tr')!
    expect(within(row).getByText('₹140')).toBeInTheDocument()
    expect(within(row).getByText('15% off')).toBeInTheDocument()
    expect(within(row).getByText('Low stock')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: /Live in shop/ })).toBeInTheDocument()
  })

  it('adds a product with the right details', async () => {
    vi.mocked(admin.createProduct).mockResolvedValue(adminProduct({ id: 30, name: 'Curd', stockQty: 20 }))
    renderApp(<ProductsPage />)
    const form = await screen.findByRole('form', { name: 'Add a product' })
    await userEvent.type(within(form).getByLabelText(/Product name/), 'Curd')
    await userEvent.selectOptions(within(form).getByLabelText(/Category/), '2')
    await userEvent.type(within(form).getByLabelText(/Pack size/), '400 g')
    await userEvent.type(within(form).getByLabelText(/Selling price/), '35')
    await userEvent.type(within(form).getByLabelText(/MRP/), '40')
    expect(within(form).getByText('13% off')).toBeInTheDocument()
    await userEvent.type(within(form).getByLabelText(/Quantity in stock/), '20')
    await userEvent.click(within(form).getByRole('button', { name: 'Add product' }))
    await waitFor(() => expect(admin.createProduct).toHaveBeenCalledWith({
      name: 'Curd', categoryId: 2, unit: '400 g', price: 35, mrp: 40, stockQty: 20, icon: '🛒',
    }))
    expect(admin.uploadProductImage).not.toHaveBeenCalled()
  })

  it('Change price shows the preview and saves; MRP below price is refused', async () => {
    vi.mocked(admin.updateProduct).mockResolvedValue({ ...tea, price: 130 })
    renderApp(<ProductsPage />)
    await userEvent.click(within((await screen.findByText('Green Tea')).closest('tr')!).getByRole('button', { name: 'Change price' }))
    const dialog = screen.getByRole('dialog')
    const price = within(dialog).getByLabelText(/Selling price/)
    await userEvent.clear(price)
    await userEvent.type(price, '170')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(within(dialog).getByText('MRP can’t be lower than the selling price.')).toBeInTheDocument()
    await userEvent.clear(price)
    await userEvent.type(price, '130')
    expect(within(dialog).getByText('Down ₹10 from ₹140')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(admin.updateProduct).toHaveBeenCalledWith(9, {
      name: 'Green Tea', categoryId: 4, unit: '25 bags', price: 130, mrp: 165, icon: '🍵', active: true,
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Green Tea price changed from ₹140 to ₹130')
  })

  it('Live/Hidden flips the shop status', async () => {
    vi.mocked(admin.updateProduct).mockResolvedValue({ ...milk, active: false, status: 'HIDDEN' })
    renderApp(<ProductsPage />)
    await userEvent.click(within((await screen.findByText('Toned Milk')).closest('tr')!).getByRole('button', { name: /Live in shop/ }))
    await waitFor(() => expect(admin.updateProduct).toHaveBeenCalledWith(7, expect.objectContaining({ active: false })))
  })

  it('Remove asks first, then removes', async () => {
    vi.mocked(admin.removeProduct).mockResolvedValue(undefined)
    renderApp(<ProductsPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Toned Milk' }))
    expect(screen.getByText(/Past orders keep their details/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove product' }))
    await waitFor(() => expect(admin.removeProduct).toHaveBeenCalledWith(7))
  })
})
