import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

import { SITE_KEY } from './captcha'
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
  return new Promise((resolve) => {
    const s = existing ?? document.createElement('script')
    s.addEventListener('load', () => resolve())
    if (!existing) {
      s.src = SCRIPT
      s.async = true
      document.head.appendChild(s)
    }
  })
}

/**
 * Cloudflare Turnstile "I'm not a robot" check (free). Shown only when VITE_TURNSTILE_SITE_KEY
 * is set; the backend checks the token when TURNSTILE_SECRET is set. resetKey re-runs it after a failure.
 */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!SITE_KEY || !box.current) return undefined
    let cancelled = false
    void loadScript().then(() => {
      if (cancelled || !box.current || !window.turnstile) return
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      })
    })
    return () => {
      cancelled = true
      if (widget.current) window.turnstile?.remove(widget.current)
      widget.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (!SITE_KEY) return null
  return <div className="turnstile" ref={box} />
}
