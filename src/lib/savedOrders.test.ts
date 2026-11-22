import { describe, expect, it } from 'vitest'
import { saveOrder, savedOrders, savedTokens, tokenFor } from './savedOrders'

describe('saved guest orders', () => {
  it('keeps the newest first, without duplicates, and finds tokens', () => {
    saveOrder({ orderNo: 'SG1001', token: 'a', placedAt: '2026-11-12T03:00:00Z' })
    saveOrder({ orderNo: 'SG1002', token: 'b', placedAt: '2026-11-12T04:00:00Z' })
    saveOrder({ orderNo: 'SG1001', token: 'a', placedAt: '2026-11-12T03:00:00Z' })
    expect(savedOrders().map((o) => o.orderNo)).toEqual(['SG1001', 'SG1002'])
    expect(tokenFor('SG1002')).toBe('b')
    expect(tokenFor('SG9999')).toBeNull()
    expect(savedTokens()).toEqual(['a', 'b'])
  })

  it('survives broken storage', () => {
    localStorage.setItem('sgmart.orders', '{not json')
    expect(savedOrders()).toEqual([])
  })
})
