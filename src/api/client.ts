import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE } from './config'

export interface ApiErrorBody {
  code: string
  message: string
  field?: string | null
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly field: string | null

  constructor(
    status: number,
    code: string,
    message: string,
    field: string | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

/**
 * Common API configuration.
 * withCredentials sends the login session cookie. Every POST, PUT and DELETE also carries a
 * CSRF token (see the interceptors below).
 */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  xsrfCookieName: CSRF_COOKIE,
  xsrfHeaderName: CSRF_HEADER,
  // The token is attached by the request interceptor below.
  withXSRFToken: false,
  timeout: 90000,
})

/* ---------------------------------------------------------------- CSRF token */

let csrfToken: string | null = null
let csrfLoading: Promise<string | null> | null = null

/** The XSRF-TOKEN cookie, when the browser lets this page read it (web app and API on one address). */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const found = document.cookie.split('; ').find((c) => c.startsWith(`${CSRF_COOKIE}=`))
  return found ? decodeURIComponent(found.slice(CSRF_COOKIE.length + 1)) : null
}

/**
 * When the web app (Vercel) and the API (Render) are on different addresses the browser hides the
 * API's XSRF-TOKEN cookie from this page, so ask the API for the token. The same call makes the
 * browser store the matching cookie, which it sends back with the header.
 */
function loadCsrfToken(): Promise<string | null> {
  if (csrfToken) return Promise.resolve(csrfToken)
  if (!csrfLoading) {
    csrfLoading = axios
      .get<{ token?: string | null }>(`${API_BASE}/auth/csrf`, { withCredentials: true, timeout: 90000 })
      .then((r) => {
        csrfToken = r.data.token ?? null
        return csrfToken
      })
      .finally(() => {
        csrfLoading = null
      })
  }
  return csrfLoading
}

const SAFE_METHODS = ['get', 'head', 'options', 'trace']

api.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.includes((config.method ?? 'get').toLowerCase())) {
    const token = readCsrfCookie() ?? (await loadCsrfToken())
    if (token) config.headers.set(CSRF_HEADER, token)
  }
  return config
})

const WAKING_UP =
  'SGMart is starting up. Please try again in a minute.'

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const e = error as AxiosError<ApiErrorBody>
    const body = e.response?.data

    if (
      e.response &&
      body &&
      typeof body === 'object' &&
      'code' in body
    ) {
      return new ApiError(
        e.response.status,
        body.code,
        body.message,
        body.field ?? null,
      )
    }

    const status = e.response?.status

    if (status === 401) {
      return new ApiError(
        401,
        'UNAUTHORIZED',
        'Please sign in again.',
      )
    }

    if (status === 403) {
      return new ApiError(
        403,
        'FORBIDDEN',
        'Request rejected. Please refresh the page and try again.',
      )
    }

    if (status === 502 || status === 503 || status === 504) {
      return new ApiError(status, 'STARTING_UP', WAKING_UP)
    }

    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
      return new ApiError(0, 'TIMEOUT', WAKING_UP)
    }

    if (!e.response) {
      return new ApiError(
        0,
        'NETWORK',
        "Can't reach SGMart. Check your internet connection and try again.",
      )
    }
  }

  return new ApiError(
    500,
    'UNKNOWN',
    'Something went wrong. Please try again.',
  )
}

type RetryableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // The token went stale (sign-in, sign-out or an expired session rotate it):
    // forget it, fetch a fresh one and send the same request once more.
    if (axios.isAxiosError(error) && error.response?.status === 403 && error.config) {
      const body = error.response.data as ApiErrorBody | undefined
      const config = error.config as RetryableConfig
      if (body?.code === 'CSRF_INVALID' && !config._csrfRetried) {
        config._csrfRetried = true
        csrfToken = null
        return api.request(config)
      }
    }
    return Promise.reject(toApiError(error))
  },
)
