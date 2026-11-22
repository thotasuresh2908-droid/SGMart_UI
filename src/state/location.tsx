import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { readJson, writeJson } from '../lib/storage'

/** Where to deliver: GPS from the browser, or an area typed by the shopper. */
export interface DeliveryLocation {
  lat: number | null
  lng: number | null
  accuracy: number | null
  area: string | null
}

interface LocationApi {
  location: DeliveryLocation | null
  setLocation: (loc: DeliveryLocation | null) => void
  detect: () => Promise<DeliveryLocation | null>
  detecting: boolean
  error: string | null
}

const KEY = 'sgmart.location'
const LocationContext = createContext<LocationApi | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setState] = useState<DeliveryLocation | null>(() => readJson<DeliveryLocation | null>(KEY, null))
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setLocation = useCallback((loc: DeliveryLocation | null) => {
    setState(loc)
    writeJson(KEY, loc)
  }, [])

  /** Asks the browser for GPS. Works only on https or localhost, and needs the shopper's permission. */
  const detect = useCallback((): Promise<DeliveryLocation | null> => {
    setError(null)
    if (!navigator.geolocation) {
      setError("Couldn't detect your location. Type your full address instead.")
      return Promise.resolve(null)
    }
    setDetecting(true)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, area: null }
          setLocation(loc)
          setDetecting(false)
          resolve(loc)
        },
        () => {
          setError("Couldn't detect your location. Allow location access in your browser, or type your full address.")
          setDetecting(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 },
      )
    })
  }, [setLocation])

  const value = useMemo(() => ({ location, setLocation, detect, detecting, error }), [location, setLocation, detect, detecting, error])
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useDeliveryLocation(): LocationApi {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useDeliveryLocation must be used inside LocationProvider')
  return ctx
}

export function locationLabel(loc: DeliveryLocation | null): string {
  if (!loc) return 'Set delivery location'
  if (loc.area) return loc.area
  if (loc.lat != null && loc.lng != null) return `Current location (${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)})`
  return 'Set delivery location'
}
