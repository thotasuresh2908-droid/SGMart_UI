import { describe, expect, it } from 'vitest'
import { normalizeMobile } from './phone'

describe('normalizeMobile (same rule as the backend)', () => {
  it.each(['9848012345', '98480 12345', '+91 98480-12345', '919848012345', '09848012345'])('accepts %s', (typed) => {
    expect(normalizeMobile(typed)).toBe('9848012345')
  })
  it.each(['12345', '1234567890', '5848012345', '98480123456', ''])('rejects %s', (typed) => {
    expect(normalizeMobile(typed)).toBeNull()
  })
})
