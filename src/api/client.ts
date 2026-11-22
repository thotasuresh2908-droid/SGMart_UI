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

  constructor(status: number, code: string, message: string, field: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

/**
 * Same origin as the web app (Vite proxies /api in development; Nginx in production),
 * so the session cookie is sent and axios copies the XSRF-TOKEN cookie into the
 * X-XSRF-TOKEN header that Spring Security checks on POST, PUT and DELETE.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 20000,
})

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const e = error as AxiosError<ApiErrorBody>
    const body = e.response?.data
    if (e.response && body && typeof body === 'object' && 'code' in body) {
      return new ApiError(e.response.status, body.code, body.message, body.field ?? null)
    }
    if (e.response?.status === 401) {
      return new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.')
    }
    if (e.response?.status === 403) {
      return new ApiError(403, 'FORBIDDEN', "You don't have access to this. Refresh the page and try again.")
    }
    if (!e.response) {
      return new ApiError(0, 'NETWORK', "Can't reach SGMart. Check your internet connection and try again.")
    }
  }
  return new ApiError(500, 'UNKNOWN', 'Something went wrong. Please try again.')
}

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)
