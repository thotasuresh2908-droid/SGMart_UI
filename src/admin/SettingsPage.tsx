import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { addAdminUser, getAdminUsers, getBlockedCustomers, unblockCustomer, updateAdminUser, updateStore } from '../api/admin'
import type { AdminRole, AdminUserView, StoreInfo } from '../api/types'
import { Modal } from '../components/Modal'
import { clock, phone, shortDate } from '../lib/format'
import { normalizeMobile } from '../lib/phone'
import { useSession, useStore } from '../state/session'
import { useToast } from '../state/toast'

const MONEY = /^\d{1,8}(\.\d{1,2})?$/

/* ------------------------------------------------ store settings */

type StoreForm = Record<'storeName' | 'phone' | 'opensAt' | 'closesAt' | 'etaMinutes' | 'deliveryFee' | 'freeDeliveryMin' | 'firstOrderCodLimit', string>

const toForm = (s: StoreInfo): StoreForm => ({
  storeName: s.storeName, phone: s.phone, opensAt: s.opensAt.slice(0, 5), closesAt: s.closesAt.slice(0, 5),
  etaMinutes: String(s.etaMinutes), deliveryFee: String(s.deliveryFee), freeDeliveryMin: String(s.freeDeliveryMin),
  firstOrderCodLimit: s.firstOrderCodLimit == null ? '' : String(s.firstOrderCodLimit),
})

function checkStore(f: StoreForm): Partial<StoreForm> {
  const e: Partial<StoreForm> = {}
  if (!f.storeName.trim()) e.storeName = 'Enter the store name.'
  if (!normalizeMobile(f.phone)) e.phone = 'Enter a valid 10-digit mobile number.'
  if (!f.opensAt) e.opensAt = 'Enter the opening time.'
  if (!f.closesAt) e.closesAt = 'Enter the closing time.'
  else if (f.opensAt === f.closesAt) e.closesAt = 'Opening and closing times can’t be the same.'
  if (!/^\d+$/.test(f.etaMinutes) || Number(f.etaMinutes) < 1 || Number(f.etaMinutes) > 240) e.etaMinutes = 'Delivery time must be 1 to 240 minutes.'
  if (!MONEY.test(f.deliveryFee)) e.deliveryFee = 'Enter the delivery fee (0 for free delivery).'
  if (!MONEY.test(f.freeDeliveryMin)) e.freeDeliveryMin = 'Enter the order amount for free delivery.'
  if (f.firstOrderCodLimit && (!MONEY.test(f.firstOrderCodLimit) || Number(f.firstOrderCodLimit) <= 0)) {
    e.firstOrderCodLimit = 'The first-order cap must be more than 0, or empty for no cap.'
  }
  return e
}

function StoreSettings({ owner }: { owner: boolean }) {
  const store = useStore()
  if (!store.data) return <div className="skeleton" />
  return <StoreSettingsForm initial={store.data} owner={owner} />
}

function StoreSettingsForm({ initial, owner }: { initial: StoreInfo; owner: boolean }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<StoreForm>(() => toForm(initial))
  const [errors, setErrors] = useState<Partial<StoreForm>>({})

  const save = useMutation({
    mutationFn: (f: StoreForm) => updateStore({
      storeName: f.storeName.trim(), phone: f.phone, opensAt: f.opensAt, closesAt: f.closesAt, etaMinutes: Number(f.etaMinutes),
      deliveryFee: Number(f.deliveryFee), freeDeliveryMin: Number(f.freeDeliveryMin),
      firstOrderCodLimit: f.firstOrderCodLimit ? Number(f.firstOrderCodLimit) : null,
    }),
    onSuccess: (s) => {
      queryClient.setQueryData(['store'], s)
      setForm(toForm(s))
      toast('Store settings saved')
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = checkStore(form)
    setErrors(found)
    if (!Object.keys(found).length) save.mutate(form)
  }
  const box = (name: keyof StoreForm, label: string, props: Record<string, string> = {}, hint?: string) => (
    <div className={`field${errors[name] ? ' bad' : ''}`}>
      <label htmlFor={`store-${name}`}>{label}</label>
      <input id={`store-${name}`} value={form[name]} disabled={!owner} {...props}
             onChange={(e) => { setForm({ ...form, [name]: e.target.value }); setErrors({ ...errors, [name]: undefined }) }} />
      {hint ? <p className="small muted">{hint}</p> : null}
      <p className="err">{errors[name]}</p>
    </div>
  )
  return (
    <form className="panel" onSubmit={submit} noValidate aria-label="Store settings">
      <h2>Store settings</h2>
      {!owner ? <p className="infobox" style={{ marginBottom: 12 }}>Only the store owner can change these settings.</p> : null}
      <div className="fgrid">
        {box('storeName', 'Store name', { maxLength: '80' })}
        {box('phone', 'Store phone (Call store buttons)', { type: 'tel', inputMode: 'numeric' })}
        {box('etaMinutes', 'Delivery time (minutes)', { inputMode: 'numeric' }, 'Shown as “Delivery in N minutes”.')}
        {box('opensAt', 'Opens at', { type: 'time' })}
        {box('closesAt', 'Closes at', { type: 'time' }, 'Hours past midnight work too.')}
        <div />
        {box('deliveryFee', 'Delivery fee (₹)', { inputMode: 'decimal' }, '0 means delivery is always free.')}
        {box('freeDeliveryMin', 'Free delivery from (₹)', { inputMode: 'decimal' })}
        {box('firstOrderCodLimit', 'First-order limit for new customers (₹)', { inputMode: 'decimal', placeholder: 'No limit' }, 'Leave empty for no limit.')}
        {owner ? <div className="actions span3"><button className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</button></div> : null}
      </div>
      {save.error ? <p className="errorbox" role="alert" style={{ marginTop: 10 }}>{save.error.message}</p> : null}
    </form>
  )
}

/* ------------------------------------------------ admin users (owner only) */

function EditAdminModal({ user, onClose }: { user: AdminUserView; onClose: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<AdminRole>(user.role)
  const [active, setActive] = useState(user.active)
  const save = useMutation({
    mutationFn: () => updateAdminUser(user.id, { name: name.trim(), role, active }),
    onSuccess: () => { toast(`${name.trim()} updated`); void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); onClose() },
  })
  return (
    <Modal title="Edit admin" onClose={onClose}>
      <p className="muted">{user.email}</p>
      <div className="field"><label htmlFor="admin-name">Name</label><input id="admin-name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field">
        <label htmlFor="admin-role">Role</label>
        <select id="admin-role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
          <option value="MANAGER">Manager (orders, stock, products, partners, payments)</option>
          <option value="OWNER">Owner (everything, including settings and admins)</option>
        </select>
      </div>
      <label className="pay" style={{ flexDirection: 'row' }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Can sign in</label>
      {save.error ? <p className="errorbox" role="alert">{save.error.message}</p> : null}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
        <button type="button" className="primary wide" onClick={() => save.mutate()} disabled={save.isPending || name.trim().length < 2}>Save</button>
      </div>
    </Modal>
  )
}

function AdminUsers() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: getAdminUsers })
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AdminRole>('MANAGER')
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({})
  const [editing, setEditing] = useState<AdminUserView | null>(null)
  const add = useMutation({
    mutationFn: () => addAdminUser({ email: email.trim(), name: name.trim(), role }),
    onSuccess: (u) => {
      toast(`${u.email} can now sign in to Admin`)
      setEmail(''); setName(''); setRole('MANAGER')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Enter the Google email address.'
    if (name.trim().length < 2) found.name = 'Enter the person’s name.'
    setErrors(found)
    if (!Object.keys(found).length) add.mutate()
  }
  return (
    <>
      <div className="panel">
        <h2>Admin users</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>Only these Google accounts can open the admin panel.</p>
        {users.isLoading ? <div className="skeleton" /> : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Name</th><th>Google email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th /></tr></thead>
              <tbody>
                {(users.data ?? []).map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td>{u.role === 'OWNER' ? 'Owner' : 'Manager'}</td>
                    <td>{u.active ? <span className="okbadge">Can sign in</span> : <span className="blockbadge">Turned off</span>}</td>
                    <td>{u.lastLoginAt ? `${shortDate(u.lastLoginAt)}, ${clock(u.lastLoginAt)}` : 'Never'}</td>
                    <td><button type="button" className="ghost" onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <form className="panel" onSubmit={submit} noValidate aria-label="Add an admin">
        <h2>Add an admin</h2>
        <div className="fgrid">
          <div className={`field${errors.email ? ' bad' : ''}`}>
            <label htmlFor="new-admin-email">Google email <i>*</i></label>
            <input id="new-admin-email" type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="err">{errors.email}</p>
          </div>
          <div className={`field${errors.name ? ' bad' : ''}`}>
            <label htmlFor="new-admin-name">Name <i>*</i></label>
            <input id="new-admin-name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            <p className="err">{errors.name}</p>
          </div>
          <div className="field">
            <label htmlFor="new-admin-role">Role</label>
            <select id="new-admin-role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <div className="actions span3"><button className="primary" disabled={add.isPending}>{add.isPending ? 'Adding…' : 'Add admin'}</button></div>
        </div>
        {add.error ? <p className="errorbox" role="alert" style={{ marginTop: 10 }}>{add.error.message}</p> : null}
      </form>
      {editing ? <EditAdminModal user={editing} onClose={() => setEditing(null)} /> : null}
    </>
  )
}

/* ------------------------------------------------ block list */

function BlockList() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const blocked = useQuery({ queryKey: ['admin', 'blocked'], queryFn: getBlockedCustomers })
  const unblock = useMutation({
    mutationFn: (id: number) => unblockCustomer(id),
    onSuccess: (c) => { toast(`${phone(c.mobile)} can order again`); void queryClient.invalidateQueries({ queryKey: ['admin'] }) },
  })
  const list = blocked.data ?? []
  return (
    <div className="panel">
      <h2>Block list</h2>
      <p className="small muted" style={{ marginBottom: 10 }}>Blocked numbers can’t place online orders and are asked to call the store. Block a number from its order card.</p>
      {blocked.isLoading ? <div className="skeleton" /> : list.length === 0 ? (
        <div className="empty"><div className="big">🙂</div><h3>No blocked numbers</h3></div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Customer</th><th>Mobile</th><th>Reason</th><th>Blocked on</th><th /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td><a href={`tel:${c.mobile}`}>{phone(c.mobile)}</a></td>
                  <td>{c.blockedReason}</td>
                  <td>{c.blockedAt ? shortDate(c.blockedAt) : ''}</td>
                  <td><button type="button" className="ghost" onClick={() => unblock.mutate(c.id)} disabled={unblock.isPending}>Unblock</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Admin > Settings: store settings (owner edits), admin users (owner only), block list. */
export function SettingsPage() {
  const session = useSession().data
  const owner = session?.role === 'OWNER'
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'store'
  const tabs = [
    { id: 'store', label: 'Store' },
    ...(owner ? [{ id: 'admins', label: 'Admin users' }] : []),
    { id: 'blocked', label: 'Block list' },
  ]
  return (
    <>
      <h1>Settings</h1>
      <div className="chips" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" className="chip" aria-selected={tab === t.id} aria-pressed={tab === t.id}
                  onClick={() => setParams(t.id === 'store' ? {} : { tab: t.id })}>{t.label}</button>
        ))}
      </div>
      {tab === 'admins' && owner ? <AdminUsers /> : tab === 'blocked' ? <BlockList /> : <StoreSettings owner={owner} />}
    </>
  )
}
