import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AdminLoginPage } from './AdminLoginPage'
import { AdminOrdersPage } from './AdminOrdersPage'
import { PartnersPage } from './PartnersPage'
import { PaymentsPage } from './PaymentsPage'
import { ProductsPage } from './ProductsPage'
import { SettingsPage } from './SettingsPage'
import { StockPage } from './StockPage'

/** Everything under /admin. Loaded as a separate bundle, so shoppers never download it. */
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="orders" replace />} />
      </Route>
    </Routes>
  )
}
