import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { readJson, writeJson } from '../lib/storage'
import { useDeliveryLocation } from '../state/location'
import { useUi } from '../state/ui'
import { CartBar } from './CartBar'
import { CartDrawer } from './CartDrawer'
import { Footer } from './Footer'
import { Header } from './Header'
import { LocationModal } from './LocationModal'
import { LoginModal } from './LoginModal'

/** Header, page, cart drawer and the shared windows. Asks for the delivery location on the first visit. */
export function ShopLayout() {
  const ui = useUi()
  const { location } = useDeliveryLocation()

  useEffect(() => {
    if (location || readJson<boolean>('sgmart.askedLocation', false)) return undefined
    writeJson('sgmart.askedLocation', true)
    const id = window.setTimeout(() => ui.open('location'), 500)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <CartDrawer />
      <CartBar />
      {ui.panel === 'login' ? <LoginModal onClose={ui.close} /> : null}
      {ui.panel === 'location' ? <LocationModal onClose={ui.close} /> : null}
    </>
  )
}
