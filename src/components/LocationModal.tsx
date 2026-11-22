import { useState, type FormEvent } from 'react'
import { useDeliveryLocation } from '../state/location'
import { useToast } from '../state/toast'
import { Modal } from './Modal'

export function LocationModal({ onClose }: { onClose: () => void }) {
  const { location, setLocation, detect, detecting, error } = useDeliveryLocation()
  const toast = useToast()
  const [area, setArea] = useState(location?.area ?? '')
  const [areaError, setAreaError] = useState('')

  const onDetect = async () => {
    const loc = await detect()
    if (loc) {
      toast('Delivery location saved')
      onClose()
    }
  }

  const onSave = (e: FormEvent) => {
    e.preventDefault()
    if (area.trim().length < 3) {
      setAreaError('Enter your area or locality.')
      return
    }
    setLocation({ lat: null, lng: null, accuracy: null, area: area.trim() })
    toast('Delivery area saved')
    onClose()
  }

  return (
    <Modal title="Where should we deliver?" onClose={onClose}>
      <p className="muted">Your location helps the delivery partner find you quickly.</p>
      <button type="button" className="primary wide" onClick={onDetect} disabled={detecting}>
        {detecting ? 'Detecting your location…' : '📍 Detect my current location'}
      </button>
      {error ? <p className="small muted">{error}</p> : null}
      <div className="or">or</div>
      <form className={`field${areaError ? ' bad' : ''}`} onSubmit={onSave} noValidate>
        <label htmlFor="area">Area or locality</label>
        <input id="area" value={area} onChange={(e) => { setArea(e.target.value); setAreaError('') }} placeholder="e.g. Road No. 12, Banjara Hills" />
        <p className="err">{areaError}</p>
        <button className="ghost wide" style={{ marginTop: 6 }}>Save area</button>
      </form>
    </Modal>
  )
}
