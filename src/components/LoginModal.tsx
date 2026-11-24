import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { continueWithGoogle, logout, updateProfile } from '../api/shop'
import { phone } from '../lib/format'
import { normalizeMobile } from '../lib/phone'
import { useProfile, useSession } from '../state/session'
import { useToast } from '../state/toast'
import { Modal } from './Modal'

/** Guests: optional "Continue with Google". Signed in: account details, Edit details, Log out. */
export function LoginModal({ onClose }: { onClose: () => void }) {
  const session = useSession().data
  const signedIn = session?.type === 'CUSTOMER'
  const profile = useProfile(signedIn).data
  const queryClient = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({})

  const save = useMutation({
    mutationFn: () => updateProfile({ name: name.trim(), mobile: mobile.trim() || undefined }),
    onSuccess: () => {
      toast('Your details are saved')
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      setEditing(false)
    },
    onError: (e) => {
      if (e instanceof ApiError && (e.field === 'mobile' || e.code === 'MOBILE_IN_USE')) setErrors({ mobile: e.message })
    },
  })

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

  if (signedIn && editing) {
    const submit = (e: FormEvent) => {
      e.preventDefault()
      const found: typeof errors = {}
      if (name.trim().length < 2) found.name = 'Enter your name.'
      if (mobile.trim() && !normalizeMobile(mobile)) found.mobile = 'Enter a valid 10-digit mobile number.'
      setErrors(found)
      if (!Object.keys(found).length) save.mutate()
    }
    return (
      <Modal title="Edit your details" onClose={onClose}>
        <form className="accountform" onSubmit={submit} noValidate>
          <div className={`field${errors.name ? ' bad' : ''}`}>
            <label htmlFor="acct-name">Name</label>
            <input id="acct-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <p className="err">{errors.name}</p>
          </div>
          <div className={`field${errors.mobile ? ' bad' : ''}`}>
            <label htmlFor="acct-mobile">Mobile number</label>
            <input id="acct-mobile" type="tel" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            <p className="small muted">Orders placed earlier from this number move into your account.</p>
            <p className="err">{errors.mobile}</p>
          </div>
          {save.error && !errors.mobile ? <p className="errorbox" role="alert">{save.error.message}</p> : null}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="ghost wide" onClick={() => setEditing(false)}>Back</button>
            <button className="primary wide" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    )
  }

  if (signedIn) {
    return (
      <Modal title="Your account" onClose={onClose}>
        <div className="box">
          <b>{profile?.name ?? session?.name}</b>
          <p className="muted small">{session?.email}</p>
          {profile?.mobile ? <p className="muted small">{phone(profile.mobile)}</p> : <p className="muted small">No mobile number yet</p>}
        </div>
        <button type="button" className="ghost wide" onClick={() => { setName(profile?.name ?? session?.name ?? ''); setMobile(profile?.mobile ?? ''); setErrors({}); setEditing(true) }}>
          Edit details
        </button>
        <Link className="ghost wide" to="/orders" onClick={onClose}>My orders</Link>
        <button type="button" className="ghost wide" onClick={onLogout}>Log out</button>
      </Modal>
    )
  }

  return (
    <Modal title="Log in or sign up" onClose={onClose}>
      <p className="muted">Logging in is optional. Sign in to save your details and see your orders on any device.</p>
      <button type="button" className="gbtn" onClick={continueWithGoogle}>
        <span className="gG" aria-hidden="true">G</span>Continue with Google
      </button>
      <button type="button" className="linkbtn small" style={{ alignSelf: 'center' }} onClick={onClose}>Continue as guest</button>
      <p className="small muted" style={{ textAlign: 'center' }}>
        Store staff? <Link to="/admin/login" onClick={onClose}>Sign in to Admin</Link>
      </p>
    </Modal>
  )
}
