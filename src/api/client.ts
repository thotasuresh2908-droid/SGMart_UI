 
import axios, { AxiosError } from 'axios'

/** The one error shape the backend returns: { code, message, field }. */
export interface ApiErrorBody {
  code: string
  message: string
  field?: string | null
}

/** Every failed API call becomes an ApiError with a message people can read. */
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

/**
 * Common API configuration.
 *
 * All API requests use:
 * https://sgmart-backend.onrender.com/api/v1
 *
 * Example:
 * api.get('/products')
 * becomes:
 * https://sgmart-backend.onrender.com/api/v1/products
 */
export const api = axios.create({
  baseURL: 'https://sgmart-backend.onrender.com/api/v1',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 90000,
})

const WAKING_UP =
  'SGMart is starting up. Please try again in a minute.'

/** Convert backend and network errors into readable API errors. */
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
        "You don't have access to this. Refresh the page and try again.",
      )
    }

    // Backend restarting or waking up.
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

/** Handle all API errors in one place. */
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
