
import { api } from './client'
import type {
  AdminOrderView, AdminProduct, AdminRole, AdminUserView, CreateProductRequest, CustomerAdminView, DeliverRequest,
  OrderCounts, OrderStatus, PageResult, PartnerRequest, PartnerView, PaymentReport, StockChangeResult, StockReport,
  StockUpdateRequest, StoreInfo, UnavailableItem, UpdateProductRequest, UpdateStoreRequest,
} from './types'

/**
 * Full-page redirect to Google Admin Login.
 * OAuth authentication starts directly on the backend domain.
 */
export const signInAdminWithGoogle = () => {
  window.location.href =
    'https://sgmart-backend.onrender.com/oauth2/authorization/google-admin'
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

/* ------------------------------------------------ products and stock */

export const getAdminProducts = () => api.get<AdminProduct[]>('/admin/products').then((r) => r.data)

export const createProduct = (body: CreateProductRequest) =>
  api.post<AdminProduct>('/admin/products', body).then((r) => r.data)

export const updateProduct = (id: number, body: UpdateProductRequest) =>
  api.put<AdminProduct>(`/admin/products/${id}`, body).then((r) => r.data)

export const removeProduct = (id: number) => api.delete(`/admin/products/${id}`).then(() => undefined)

export const uploadProductImage = (id: number, file: Blob, filename = 'photo.jpg') => {
  const form = new FormData()
  form.append('file', file, filename)
  return api.post<AdminProduct>(`/admin/products/${id}/image`, form).then((r) => r.data)
}

export const removeProductImage = (id: number) =>
  api.delete<AdminProduct>(`/admin/products/${id}/image`).then((r) => r.data)

export const updateStock = (id: number, body: StockUpdateRequest) =>
  api.post<StockChangeResult>(`/admin/products/${id}/stock`, body).then((r) => r.data)

export const getStockReport = (date?: string | null) =>
  api.get<StockReport>('/admin/reports/stock', { params: { date: date || undefined } }).then((r) => r.data)

/* ------------------------------------------------ payments */

export const getPaymentReport = (params: { date?: string | null; all?: boolean }) =>
  api.get<PaymentReport>('/admin/reports/payments', { params: { date: params.date || undefined, all: params.all || undefined } }).then((r) => r.data)

/* ------------------------------------------------ partners */

export const createPartner = (body: PartnerRequest) =>
  api.post<PartnerView>('/admin/delivery-partners', body).then((r) => r.data)

export const updatePartner = (id: number, body: PartnerRequest & { active: boolean }) =>
  api.put<PartnerView>(`/admin/delivery-partners/${id}`, body).then((r) => r.data)

export const setPartnerStatus = (id: number, status: 'AVAILABLE' | 'OFF_DUTY') =>
  api.post<PartnerView>(`/admin/delivery-partners/${id}/status`, { status }).then((r) => r.data)

/* ------------------------------------------------ settings, admin users, block list */

export const updateStore = (body: UpdateStoreRequest) => api.put<StoreInfo>('/admin/store', body).then((r) => r.data)

export const getAdminUsers = () => api.get<AdminUserView[]>('/admin/admin-users').then((r) => r.data)

export const addAdminUser = (body: { email: string; name: string; role: AdminRole }) =>
  api.post<AdminUserView>('/admin/admin-users', body).then((r) => r.data)

export const updateAdminUser = (id: number, body: { name: string; role: AdminRole; active: boolean }) =>
  api.put<AdminUserView>(`/admin/admin-users/${id}`, body).then((r) => r.data)

export const getBlockedCustomers = () => api.get<CustomerAdminView[]>('/admin/customers/blocked').then((r) => r.data)

export const blockCustomer = (customerId: number, reason: string) =>
  api.post<CustomerAdminView>(`/admin/customers/${customerId}/block`, { reason }).then((r) => r.data)

export const unblockCustomer = (customerId: number) =>
  api.post<CustomerAdminView>(`/admin/customers/${customerId}/unblock`).then((r) => r.data)
