
import axios, { AxiosError } from 'axios'

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

/**
 * Common API configuration.
 * All API requests use the Render backend.
 */
export const api = axios.create({
  baseURL: 'https://sgmart-backend.onrender.com/api/v1',
  withCredentials: true,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  // Enable XSRF header handling for cross-origin requests.
  withXSRFToken: true,

  timeout: 90000,
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

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
