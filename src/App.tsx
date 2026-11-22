import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { ShopLayout } from './components/ShopLayout'
import { MyOrdersPage } from './pages/MyOrdersPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OrderPage } from './pages/OrderPage'
import { ShopPage } from './pages/ShopPage'

// The admin panel is a separate download; shoppers never load it.
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <Routes>
      <Route element={<ShopLayout />}>
        <Route index element={<ShopPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="orders/:orderNo" element={<OrderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<main className="wrap"><div className="skeleton" /></main>}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  )
}
