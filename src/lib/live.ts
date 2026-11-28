import { Client, type IMessage } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import { BACKEND_URL } from '../api/config'
import type { LiveOrderMessage } from '../api/types'

export interface LiveSubscription {
  /** e.g. /topic/orders/SG1001 or /topic/admin/orders */
  topic: string
  /** Guest orders: the tracking token, sent as a SUBSCRIBE header. */
  token?: string | null
}

/**
 * Live updates need WebSockets on the same address as the web app. A Render static site can
 * forward normal requests to the backend but not WebSockets, so there set VITE_LIVE_UPDATES=off:
 * screens then refresh every 15 seconds instead (the same fallback used when a connection drops).
 */
export const liveEnabled = (import.meta.env.VITE_LIVE_UPDATES ?? 'on') !== 'off'

function brokerUrl(): string {
  // Same address as the web app, or the backend's own address when the app calls it directly.
  const base = BACKEND_URL || window.location.origin
  return `${base.replace(/^http/, 'ws')}/ws`
}

/**
 * Live updates over STOMP/WebSocket. The browser's session cookie goes with the
 * connection; guests prove access to an order with its tracking token.
 * Returns whether the connection is up, so screens can poll every 15 s when it isn't.
 */
export function useLiveUpdates(subscriptions: LiveSubscription[], onMessage: (m: LiveOrderMessage) => void): boolean {
  const [connected, setConnected] = useState(false)
  const handler = useRef(onMessage)
  handler.current = onMessage
  const key = subscriptions.map((s) => `${s.topic}|${s.token ?? ''}`).sort().join(',')

  useEffect(() => {
    if (!liveEnabled || subscriptions.length === 0 || typeof WebSocket === 'undefined') return undefined
    const client = new Client({
      brokerURL: brokerUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
    })
    client.onConnect = () => {
      setConnected(true)
      subscriptions.forEach((s) => {
        client.subscribe(
          s.topic,
          (frame: IMessage) => {
            try {
              handler.current(JSON.parse(frame.body) as LiveOrderMessage)
            } catch {
              /* ignore a malformed message */
            }
          },
          s.token ? { 'X-Tracking-Token': s.token } : {},
        )
      })
    }
    client.onWebSocketClose = () => setConnected(false)
    client.onStompError = () => setConnected(false)
    client.activate()
    return () => {
      setConnected(false)
      void client.deactivate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return connected
}
