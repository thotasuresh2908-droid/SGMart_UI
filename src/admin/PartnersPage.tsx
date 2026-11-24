import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createPartner, getPartners, setPartnerStatus, updatePartner } from '../api/admin'
import type { PartnerView, VehicleType } from '../api/types'
import { CallButton } from '../components/CallButton'
import { Modal } from '../components/Modal'
import { initials, phone } from '../lib/format'
import { normalizeMobile } from '../lib/phone'
import { useToast } from '../state/toast'
import { VEHICLE } from './adminLabels'

const STATUS = { AVAILABLE: { cls: 'available', text: 'Available' }, ON_DELIVERY: { cls: 'busy', text: 'On a delivery' }, OFF_DUTY: { cls: 'off', text: 'Off duty' } } as const

interface PartnerForm { name: string; mobile: string; vehicleType: VehicleType; active: boolean }
type PartnerErrors = Partial<Record<'name' | 'mobile', string>>

function check(v: PartnerForm): PartnerErrors {
  const e: PartnerErrors = {}
  if (v.name.trim().length < 2) e.name = 'Enter the partner’s name.'
  if (!normalizeMobile(v.mobile)) e.mobile = 'Enter a valid 10-digit mobile number.'
  return e
}

function PartnerFields({ v, e, onChange, idPrefix }: { v: PartnerForm; e: PartnerErrors; onChange: (p: Partial<PartnerForm>) => void; idPrefix: string }) {
  return (
    <>
      <div className={`field${e.name ? ' bad' : ''}`}>
        <label htmlFor={`${idPrefix}-name`}>Full name <i>*</i></label>
        <input id={`${idPrefix}-name`} maxLength={100} placeholder="e.g. Kiran Rao" value={v.name} onChange={(x) => onChange({ name: x.target.value })} />
        <p className="err">{e.name}</p>
      </div>
      <div className={`field${e.mobile ? ' bad' : ''}`}>
        <label htmlFor={`${idPrefix}-mobile`}>Mobile number <i>*</i></label>
        <input id={`${idPrefix}-mobile`} type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={v.mobile} onChange={(x) => onChange({ mobile: x.target.value })} />
        <p className="err">{e.mobile}</p>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-vehicle`}>Vehicle</label>
        <select id={`${idPrefix}-vehicle`} value={v.vehicleType} onChange={(x) => onChange({ vehicleType: x.target.value as VehicleType })}>
          {(Object.keys(VEHICLE) as VehicleType[]).map((k) => <option key={k} value={k}>{VEHICLE[k]}</option>)}
        </select>
      </div>
    </>
  )
}

function EditPartnerModal({ partner, onClose }: { partner: PartnerView; onClose: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [v, setV] = useState<PartnerForm>({ name: partner.name, mobile: partner.mobile, vehicleType: partner.vehicleType, active: partner.active })
  const [e, setE] = useState<PartnerErrors>({})
  const save = useMutation({
    mutationFn: () => updatePartner(partner.id, { name: v.name.trim(), mobile: v.mobile, vehicleType: v.vehicleType, active: v.active }),
    onSuccess: (p) => { toast(`${p.name} updated`); void queryClient.invalidateQueries({ queryKey: ['admin'] }); onClose() },
  })
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const found = check(v)
    setE(found)
    if (!Object.keys(found).length) save.mutate()
  }
  return (
    <Modal title="Edit delivery partner" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PartnerFields v={v} e={e} onChange={(p) => setV((x) => ({ ...x, ...p }))} idPrefix="edit-partner" />
        <label className="pay" style={{ flexDirection: 'row' }}>
          <input type="checkbox" checked={v.active} onChange={(x) => setV((y) => ({ ...y, active: x.target.checked }))} />
          {' '}Active (unticked partners can’t be assigned orders)
        </label>
        {save.error ? <p className="errorbox" role="alert">{save.error.message}</p> : null}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="ghost wide" onClick={onClose}>Cancel</button>
          <button className="primary wide" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Admin > Delivery partners. */
export function PartnersPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const partners = useQuery({ queryKey: ['admin', 'partners'], queryFn: getPartners })
  const [form, setForm] = useState<PartnerForm>({ name: '', mobile: '', vehicleType: 'BIKE', active: true })
  const [errors, setErrors] = useState<PartnerErrors>({})
  const [editing, setEditing] = useState<PartnerView | null>(null)

  const add = useMutation({
    mutationFn: () => createPartner({ name: form.name.trim(), mobile: form.mobile, vehicleType: form.vehicleType }),
    onSuccess: (p) => {
      toast(`${p.name} added as a delivery partner`)
      setForm({ name: '', mobile: '', vehicleType: 'BIKE', active: true })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
  const status = useMutation({
    mutationFn: (p: PartnerView) => setPartnerStatus(p.id, p.status === 'OFF_DUTY' ? 'AVAILABLE' : 'OFF_DUTY'),
    onSuccess: (p) => { toast(`${p.name} is ${p.status === 'AVAILABLE' ? 'available' : 'off duty'}`); void queryClient.invalidateQueries({ queryKey: ['admin'] }) },
    onError: (e) => toast(e.message),
  })
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const found = check(form)
    setErrors(found)
    if (!Object.keys(found).length) add.mutate()
  }

  const list = partners.data ?? []
  return (
    <>
      <h1>Delivery partners</h1>
      {partners.isLoading ? <div className="skeleton" /> : list.length === 0 ? (
        <div className="empty panel"><div className="big">🛵</div><h3>No delivery partners yet</h3><p>Add your first partner below.</p></div>
      ) : (
        <div className="pgrid">
          {list.map((p) => (
            <div className={`pcard${p.active ? '' : ' inactive'}`} key={p.id}>
              <div className="top">
                <span className="pav">{initials(p.name)}</span>
                <div><b>{p.name}</b><span><a href={`tel:${p.mobile}`}>{phone(p.mobile)}</a></span></div>
                <span className={`pstat ${p.active ? STATUS[p.status].cls : 'off'}`}>{p.active ? STATUS[p.status].text : 'Inactive'}</span>
              </div>
              <p className="meta">
                {VEHICLE[p.vehicleType]}, {p.deliveriesToday} today, {p.deliveriesTotal} deliver{p.deliveriesTotal === 1 ? 'y' : 'ies'} in total
                {p.currentOrders.length ? <><br />Now delivering {p.currentOrders.map((o) => `#${o}`).join(', ')}</> : null}
              </p>
              <div className="oacts">
                <CallButton mobile={p.mobile} label={`Call ${p.name.split(' ')[0]}`} />
                {p.active && p.status !== 'ON_DELIVERY' ? (
                  <button type="button" className="ghost" onClick={() => status.mutate(p)} disabled={status.isPending}>
                    {p.status === 'OFF_DUTY' ? 'Mark as available' : 'Mark as off duty'}
                  </button>
                ) : null}
                <button type="button" className="linkbtn small" onClick={() => setEditing(p)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form className="panel" onSubmit={submit} noValidate aria-label="Add a delivery partner">
        <h2>Add a delivery partner</h2>
        <div className="fgrid">
          <PartnerFields v={form} e={errors} onChange={(p) => setForm((x) => ({ ...x, ...p }))} idPrefix="add-partner" />
          <div className="actions span3"><button className="primary" disabled={add.isPending}>{add.isPending ? 'Adding…' : 'Add partner'}</button></div>
        </div>
        {add.error ? <p className="errorbox" role="alert" style={{ marginTop: 10 }}>{add.error.message}</p> : null}
      </form>
      {editing ? <EditPartnerModal partner={editing} onClose={() => setEditing(null)} /> : null}
    </>
  )
}
