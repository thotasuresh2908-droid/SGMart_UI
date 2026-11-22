import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { CartProvider } from '../state/cart'
import { LocationProvider } from '../state/location'
import { ToastProvider } from '../state/toast'
import { UiProvider } from '../state/ui'

/** Renders with the same providers as the real app (no retries, so failures show at once). */
export function renderApp(ui: ReactElement, initialEntries: string[] = ['/']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <ToastProvider>
          <UiProvider>
            <LocationProvider>
              <CartProvider>{ui}</CartProvider>
            </LocationProvider>
          </UiProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
