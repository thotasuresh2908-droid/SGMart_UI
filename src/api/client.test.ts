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

describe('CSRF token on POST', () => {
  it('fetches a token from the backend, sends it, and retries once when it was stale', async () => {
    const axios = (await import('axios')).default
    const { api } = await import('./client')

    let tokenCalls = 0
    axios.defaults.adapter = async (config) => {
      tokenCalls += 1
      return { data: { token: `t${tokenCalls}` }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const sent: Array<string | undefined> = []
    api.defaults.adapter = async (config) => {
      const token = config.headers.get('X-XSRF-TOKEN') as string | undefined
      sent.push(token)
      if (sent.length === 1) {
        const response = {
          status: 403, statusText: 'Forbidden', headers: {}, config,
          data: { code: 'CSRF_INVALID', message: 'Please refresh the page and try again.' },
        }
        throw new AxiosError('forbidden', 'ERR_BAD_REQUEST', config, undefined, response as never)
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const result = await api.post('/orders', { a: 1 })
    expect(result.data).toEqual({ ok: true })
    expect(sent).toEqual(['t1', 't2'])
  })

  it('does not call the token endpoint for GET requests', async () => {
    const axios = (await import('axios')).default
    const { api } = await import('./client')
    let tokenCalls = 0
    axios.defaults.adapter = async (config) => {
      tokenCalls += 1
      return { data: { token: 'x' }, status: 200, statusText: 'OK', headers: {}, config }
    }
    api.defaults.adapter = async (config) => ({ data: [], status: 200, statusText: 'OK', headers: {}, config })
    await api.get('/products')
    expect(tokenCalls).toBe(0)
  })

  it('shows the backend message for a CSRF failure', () => {
    const e = toApiError(axiosError(403, { code: 'CSRF_INVALID', message: 'Refresh and try again.' }))
    expect([e.status, e.code, e.message]).toEqual([403, 'CSRF_INVALID', 'Refresh and try again.'])
  })
})
