import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { shrinkPhoto } from '../lib/image'

/** What the admin chose: keep the current photo, a new one, or remove it. */
export type PhotoChoice = { kind: 'keep' } | { kind: 'new'; blob: Blob } | { kind: 'remove' }

interface Props {
  currentUrl: string | null
  icon: string
  choice: PhotoChoice
  onChange: (choice: PhotoChoice) => void
  inputId: string
}

/** Click or drag a photo. Big phone photos are shrunk in the browser before upload. */
export function PhotoPicker({ currentUrl, icon, choice, onChange, inputId }: Props) {
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  // A temporary browser URL for the chosen photo; released when it changes or the window closes.
  const preview = useMemo(
    () => (choice.kind === 'new' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(choice.blob) : null),
    [choice],
  )
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const take = async (file: File | undefined) => {
    setError('')
    if (!file) return
    try {
      onChange({ kind: 'new', blob: await shrinkPhoto(file) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo couldn’t be used.')
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void take(e.dataTransfer.files[0])
  }

  const shown = choice.kind === 'new' ? preview : choice.kind === 'remove' ? null : currentUrl
  return (
    <div>
      <label
        className={`dropzone${dragging ? ' drag' : ''}`}
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="dz-prev">{shown ? <img src={shown} alt="Product photo preview" /> : icon}</span>
        <span>
          <b>{shown ? 'Change photo' : 'Upload a photo'}</b>
          <br />
          <span className="small muted">Click to choose, or drag an image here. JPG, PNG or WebP.</span>
        </span>
        <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr"
               onChange={(e) => { void take(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {shown ? (
        <button type="button" className="linkbtn small" style={{ marginTop: 6 }} onClick={() => onChange({ kind: 'remove' })}>
          Remove photo
        </button>
      ) : null}
      {error ? <p className="err">{error}</p> : null}
    </div>
  )
}
