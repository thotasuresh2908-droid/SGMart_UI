import { describe, expect, it } from 'vitest'
import { checkoutSchema } from './checkoutSchema'

const valid = { customerName: 'Priya Sharma', mobile: '98765 43210', addressLine: 'Flat 302, Road No. 12', landmark: '', paymentMethod: 'CASH_ON_DELIVERY' as const }

describe('checkout rules', () => {
  it('accepts a normal checkout', () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true)
  })

  it('gives the same messages as the backend', () => {
    const r = checkoutSchema.safeParse({ ...valid, customerName: 'P', mobile: '12345', addressLine: 'short' })
    const messages = r.success ? [] : r.error.issues.map((i) => i.message)
    expect(messages).toEqual([
      'Enter the name of the person receiving the order.',
      'Enter a valid 10-digit mobile number.',
      'Enter your full address so the partner can find you.',
    ])
  })
})
