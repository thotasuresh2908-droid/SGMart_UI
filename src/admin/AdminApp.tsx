import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AdminLoginPage } from './AdminLoginPage'
import { AdminOrdersPage } from './AdminOrdersPage'
import { ComingSoon } from './ComingSoon'

/** Everything under /admin. Loaded as a separate bundle, so shoppers never download it. */
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="stock" element={<ComingSoon title="Today’s stock" />} />
        <Route path="products" element={<ComingSoon title="Products" />} />
        <Route path="partners" element={<ComingSoon title="Delivery partners" />} />
        <Route path="payments" element={<ComingSoon title="Payments" />} />
        <Route path="settings" element={<ComingSoon title="Settings" />} />
        <Route path="*" element={<Navigate to="orders" replace />} />
      </Route>
    </Routes>
  )
}
