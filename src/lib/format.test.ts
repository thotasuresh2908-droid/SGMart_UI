import { describe, expect, it } from 'vitest'
import { clock, etaText, money, phone, relative } from './format'

describe('format', () => {
  it('shows rupees like the prototype, with Indian grouping', () => {
    expect(money(126)).toBe('₹126')
    expect(money(126.5)).toBe('₹126.50')
    expect(money(1210)).toBe('₹1,210')
    expect(money(125000)).toBe('₹1,25,000')
    expect(money(null)).toBe('–')
  })

  it('shows times in India time whatever the device zone', () => {
    expect(clock('2026-11-12T03:00:00Z')).toMatch(/^8:30\s?am$/i)
  })

  it('counts down to the ETA, then says any minute, then the delivery time', () => {
    const eta = '2026-11-12T03:10:00Z'
    expect(etaText(eta, null, Date.parse('2026-11-12T03:02:18Z'))).toBe('Arriving in 7:42')
    expect(etaText(eta, null, Date.parse('2026-11-12T03:11:00Z'))).toBe('Arriving any minute now')
    expect(etaText(eta, '2026-11-12T03:09:00Z', Date.now())).toMatch(/^Delivered at 8:39\s?am$/i)
  })

  it('formats phone numbers and relative times', () => {
    expect(phone('9876543210')).toBe('98765 43210')
    const now = Date.parse('2026-11-12T03:30:00Z')
    expect(relative('2026-11-12T03:29:40Z', now)).toBe('Just now')
    expect(relative('2026-11-12T03:25:00Z', now)).toBe('5 min ago')
    expect(relative('2026-11-12T01:30:00Z', now)).toBe('2 hr ago')
  })
})
