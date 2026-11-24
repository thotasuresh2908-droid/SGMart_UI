import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from './client'

function axiosError(status?: number, data?: unknown, code?: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = status ? { status, statusText: '', headers: {}, config, data } : undefined
  return new AxiosError('failed', code, config, undefined, response as never)
}

describe('toApiError', () => {
  it('keeps the backend message and field', () => {
    const e = toApiError(axiosError(400, { code: 'INVALID_MOBILE', message: 'Enter a valid 10-digit mobile number.', field: 'mobile' }))
    expect(e).toBeInstanceOf(ApiError)
    expect([e.code, e.message, e.field]).toEqual(['INVALID_MOBILE', 'Enter a valid 10-digit mobile number.', 'mobile'])
  })

  it('explains a sleeping or restarting backend instead of blaming the internet', () => {
    expect(toApiError(axiosError(502, '<html>Bad gateway</html>')).message).toBe('SGMart is starting up. Please try again in a minute.')
    expect(toApiError(axiosError(503)).code).toBe('STARTING_UP')
    expect(toApiError(axiosError(undefined, undefined, 'ECONNABORTED')).code).toBe('TIMEOUT')
  })

  it('no response at all is a connection problem', () => {
    expect(toApiError(axiosError(undefined, undefined, 'ERR_NETWORK')).message).toContain('Check your internet connection')
  })

  it('401 and 403 without a body get clear messages', () => {
    expect(toApiError(axiosError(401)).message).toBe('Please sign in again.')
    expect(toApiError(axiosError(403)).code).toBe('FORBIDDEN')
  })
})
