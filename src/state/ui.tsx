import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Panel = 'none' | 'cart' | 'checkout' | 'login' | 'location'

interface UiApi {
  panel: Panel
  open: (panel: Panel) => void
  close: () => void
}

const UiContext = createContext<UiApi | null>(null)

/** Which drawer or window is open (cart, checkout, log in, location). One at a time. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>('none')
  const value = useMemo(() => ({ panel, open: setPanel, close: () => setPanel('none') }), [panel])
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiApi {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
