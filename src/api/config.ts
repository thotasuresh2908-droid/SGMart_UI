/**
 * Where the SGMart backend lives.
 *
 *   VITE_BACKEND_URL not set  -> https://sgmart-backend.onrender.com (the browser calls Render directly)
 *   VITE_BACKEND_URL=/        -> same address as the web app (the rewrites in vercel.json / render.yaml
 *                                forward /api, /oauth2 and /login/oauth2 to the backend)
 *   VITE_BACKEND_URL=https://x -> that backend
 */
const DEFAULT_BACKEND = 'https://sgmart-backend.onrender.com'

const raw = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim()

/** Backend address without a trailing slash; empty string means "same address as the web app". */
export const BACKEND_URL = !raw ? DEFAULT_BACKEND : raw === '/' ? '' : raw.replace(/\/+$/, '')

export const API_BASE = `${BACKEND_URL}/api/v1`

/** Full-page redirect target that starts Google sign-in on the backend. */
export const googleLoginUrl = (registration: 'google-customer' | 'google-admin') =>
  `${BACKEND_URL}/oauth2/authorization/${registration}`
