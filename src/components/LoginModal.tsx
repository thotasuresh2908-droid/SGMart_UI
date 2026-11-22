import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { continueWithGoogle, logout } from '../api/shop'
import { phone } from '../lib/format'
import { useProfile, useSession } from '../state/session'
import { useToast } from '../state/toast'
import { Modal } from './Modal'

/** Guests: optional "Continue with Google". Signed in: account details and Log out. */
export function LoginModal({ onClose }: { onClose: () => void }) {
  const session = useSession().data
  const signedIn = session?.type === 'CUSTOMER'
  const profile = useProfile(signedIn).data
  const queryClient = useQueryClient()
  const toast = useToast()

  const onLogout = async () => {
    try {
      await logout()
    } finally {
      queryClient.clear()
      await queryClient.invalidateQueries()
      toast('Logged out')
      onClose()
    }
  }

  if (signedIn) {
    return (
      <Modal title="Your account" onClose={onClose}>
        <div className="box">
          <b>{profile?.name ?? session?.name}</b>
          <p className="muted small">{session?.email}</p>
          {profile?.mobile ? <p className="muted small">{phone(profile.mobile)}</p> : null}
        </div>
        <Link className="ghost wide" to="/orders" onClick={onClose}>My orders</Link>
        <button type="button" className="ghost wide" onClick={onLogout}>Log out</button>
      </Modal>
    )
  }

  return (
    <Modal title="Log in or sign up" onClose={onClose}>
      <p className="muted">
        Logging in is optional. Sign in to save your details and see your orders on any device.
      </p>
      <button type="button" className="gbtn" onClick={continueWithGoogle}>
        <span className="gG" aria-hidden="true">G</span>Continue with Google
      </button>
      <button type="button" className="linkbtn small" style={{ alignSelf: 'center' }} onClick={onClose}>
        Continue as guest
      </button>
    </Modal>
  )
}
