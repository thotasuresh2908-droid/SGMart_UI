import { api } from './client'
import type {
  AdminOrderView, AdminUserView, CustomerAdminView, DeliverRequest, OrderCounts, OrderStatus, PageResult,
  PartnerView, UnavailableItem,
} from './types'

/** Full-page redirect to Google; the backend brings admins back to /admin/orders (or /admin/login?error=...). */
export const signInAdminWithGoogle = () => {
  window.location.href = '/oauth2/authorization/google-admin'
}

export const getAdminMe = () => api.get<AdminUserView>('/admin/me').then((r) => r.data)

/* ------------------------------------------------ orders */

export const getAdminOrders = (params: { status?: OrderStatus | null; date?: string | null; page?: number; size?: number }) =>
  api
    .get<PageResult<AdminOrderView>>('/admin/orders', {
      params: { status: params.status ?? undefined, date: params.date || undefined, page: params.page ?? 0, size: params.size ?? 20 },
    })
    .then((r) => r.data)

export const getOrderCounts = () => api.get<OrderCounts>('/admin/orders/counts').then((r) => r.data)

export const acceptOrder = (orderNo: string, unavailableItems: UnavailableItem[], customerCallConfirmed: boolean) =>
  api.post<AdminOrderView>(`/admin/orders/${orderNo}/accept`, { unavailableItems, customerCallConfirmed }).then((r) => r.data)

export const rejectOrder = (orderNo: string, reason: string) =>
  api.post<AdminOrderView>(`/admin/orders/${orderNo}/reject`, { reason }).then((r) => r.data)

export const dispatchOrder = (orderNo: string, partnerId: number) =>
  api.post<AdminOrderView>(`/admin/orders/${orderNo}/dispatch`, { partnerId }).then((r) => r.data)

export const deliverOrder = (orderNo: string, body: DeliverRequest) =>
  api.post<AdminOrderView>(`/admin/orders/${orderNo}/deliver`, body).then((r) => r.data)

/* ------------------------------------------------ customers and partners */

export const verifyCustomer = (customerId: number) =>
  api.post<CustomerAdminView>(`/admin/customers/${customerId}/verify`).then((r) => r.data)

export const getPartners = () => api.get<PartnerView[]>('/admin/delivery-partners').then((r) => r.data)
