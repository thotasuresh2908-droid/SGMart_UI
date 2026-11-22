import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { product } from '../test/fixtures'
import { renderApp } from '../test/render'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  it('shows discount and low stock, and turns Add into a − 1 + stepper', async () => {
    renderApp(<ProductCard product={product({ name: 'Green Tea', price: 140, mrp: 165, discountPercent: 15, stockLeft: 2, lowStock: true })} etaMinutes={10} />)
    expect(screen.getByText('15% off')).toBeInTheDocument()
    expect(screen.getByText('Only 2 left')).toBeInTheDocument()
    expect(screen.getByText('₹140')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add Green Tea' }))
    expect(screen.getByText('1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add one Green Tea' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add one Green Tea' }))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Only 2 Green Tea in stock')
  })
})
