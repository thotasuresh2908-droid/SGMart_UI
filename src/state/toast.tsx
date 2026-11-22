import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ShowToast = (message: string) => void
const ToastContext = createContext<ShowToast>(() => {})

/** One short message at the bottom of the screen, like the prototype. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback<ShowToast>((text) => {
    setMessage(text)
    setVisible(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), 3000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast${visible ? ' on' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
