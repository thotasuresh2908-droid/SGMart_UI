import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ApiError } from './api/client'
import App from './App'
import { CartProvider } from './state/cart'
import { LocationProvider } from './state/location'
import { ToastProvider } from './state/toast'
import { UiProvider } from './state/ui'
import './styles/app.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry network blips and server errors, never "not found" or "not allowed".
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <UiProvider>
            <LocationProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </LocationProvider>
          </UiProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
