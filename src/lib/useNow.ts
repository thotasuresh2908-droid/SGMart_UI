import { useEffect, useState } from 'react'

/** Re-renders every `ms` milliseconds (for countdowns and "5 min ago"). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}
