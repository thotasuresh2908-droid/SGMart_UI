import { api } from './client'
import { googleLoginUrl } from './config'
import type {
  Category, ClaimResult, CustomerProfile, ItemRequest, OrderView, PageResult, PlaceOrderRequest,
  PlacedOrder, SessionInfo, ShopProduct, StoreInfo,
} from './types'

const TOKEN_HEADER = 'X-Tracking-Token'
const withToken = (token?: string | null) => (token ? { headers: { [TOKEN_HEADER]: token } } : {})

/* ------------------------------------------------ store, catalog */

export const getStore = () => api.get<StoreInfo>('/store').then((r) => r.data)

export const getCategories = () => api.get<Category[]>('/categories').then((r) => r.data)

export const getProducts = (params: { category?: number | null; q?: string | null; page?: number; size?: number }) =>
  api
    .get<PageResult<ShopProduct>>('/products', {
      params: {
        category: params.category ?? undefined,
        q: params.q?.trim() || undefined,
        page: params.page ?? 0,
        size: params.size ?? 60,
      },
    })
    .then((r) => r.data)

/* ------------------------------------------------ sign-in */

export const getSession = () => api.get<SessionInfo>('/auth/session').then((r) => r.data)

export const logout = () => api.post('/auth/logout').then(() => undefined)

/**
 * Full-page redirect to Google Customer Login.
 * Start OAuth directly on the backend domain so the backend session
 * can be maintained during the OAuth authorization flow.
 */
export const continueWithGoogle = () => {
  window.location.href = googleLoginUrl('google-customer')
}

export const getProfile = () => api.get<CustomerProfile>('/me').then((r) => r.data)

export const updateProfile = (body: { name: string; mobile?: string }) =>
  api.put<CustomerProfile>('/me', body).then((r) => r.data)

/* ------------------------------------------------ orders */

export const placeOrder = (body: PlaceOrderRequest) => api.post<PlacedOrder>('/orders', body).then((r) => r.data)

export const getOrder = (orderNo: string, token?: string | null) =>
  api.get<OrderView>(`/orders/${encodeURIComponent(orderNo)}`, withToken(token)).then((r) => r.data)

/** Guest "My orders": the orders whose tokens this browser saved. */
export const lookupOrders = (trackingTokens: string[]) =>
  api.post<OrderView[]>('/orders/lookup', { trackingTokens }).then((r) => r.data)

export const getMyOrders = () => api.get<OrderView[]>('/me/orders').then((r) => r.data)

export const claimOrders = (trackingTokens: string[]) =>
  api.post<ClaimResult>('/me/claim-orders', { trackingTokens }).then((r) => r.data)

export const editOrderItems = (orderNo: string, items: ItemRequest[], token?: string | null) =>
  api.put<OrderView>(`/orders/${encodeURIComponent(orderNo)}/items`, { items }, withToken(token)).then((r) => r.data)

export const cancelOrder = (orderNo: string, reason: string, token?: string | null) =>
  api.post<OrderView>(`/orders/${encodeURIComponent(orderNo)}/cancel`, { reason }, withToken(token)).then((r) => r.data)
