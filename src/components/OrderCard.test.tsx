import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { order } from '../test/fixtures'
import { renderApp } from '../test/render'
import { OrderCard } from './OrderCard'

const now = Date.parse('2026-11-12T03:02:18Z')

describe('OrderCard', () => {
  it('waiting order: countdown, edit, cancel and call store', () => {
    renderApp(<OrderCard order={order()} token="t" now={now} />)
    expect(screen.getByText('Waiting for store')).toBeInTheDocument()
    expect(screen.getByText('Arriving in 7:42')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add or remove items/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel order' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Call store/ })).toHaveAttribute('href', 'tel:9000012345')
    expect(screen.getByText(/₹126 to be collected/)).toBeInTheDocument()
  })

  it('accepted order can no longer be changed', () => {
    renderApp(<OrderCard order={order({ status: 'ACCEPTED', acceptedAt: '2026-11-12T03:01:00Z', canEdit: false, canCancel: false })} token="t" now={now} />)
    expect(screen.queryByRole('button', { name: /Add or remove items/ })).not.toBeInTheDocument()
    expect(screen.getByText(/can’t be changed here/)).toBeInTheDocument()
  })

  it('on the way: shows the partner with a call button', () => {
    renderApp(<OrderCard order={order({
      status: 'OUT_FOR_DELIVERY', acceptedAt: '2026-11-12T03:01:00Z', outForDeliveryAt: '2026-11-12T03:02:00Z',
      deliveryPartner: { id: 1, name: 'Ravi Kumar', mobile: '9848012345', vehicleType: 'BIKE' },
    })} token="t" now={now} />)
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Call delivery partner/ })).toHaveAttribute('href', 'tel:9848012345')
  })

  it('delivered: shows the payment trail', () => {
    renderApp(<OrderCard order={order({
      status: 'DELIVERED', deliveredAt: '2026-11-12T03:09:00Z', total: 308,
      payment: { method: 'UPI', amount: 308, paidByName: 'Mohammed Irfan', collectedBy: 'Ravi Kumar', upiRef: '4821 9930 7712', confirmedBy: 'Store Owner', confirmedAt: '2026-11-12T03:09:00Z' },
    })} token="t" now={now} />)
    expect(screen.getByText('Paid ₹308 by UPI')).toBeInTheDocument()
    expect(screen.getByText(/Mohammed Irfan paid ₹308 by UPI \(UPI ref 4821 9930 7712\) to Ravi Kumar/)).toBeInTheDocument()
    expect(screen.getByText('Payment confirmed by Store Owner')).toBeInTheDocument()
  })

  it('declined order explains why', () => {
    renderApp(<OrderCard order={order({ status: 'REJECTED', rejectReason: 'Address is outside our delivery area' })} token="t" now={now} />)
    expect(screen.getByText(/couldn’t accept this order: Address is outside our delivery area/)).toBeInTheDocument()
  })
})
