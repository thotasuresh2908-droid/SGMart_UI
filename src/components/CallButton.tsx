import { phone } from '../lib/format'

interface Props {
  mobile: string
  label: string
  variant?: 'call' | 'ghost' | 'primary'
  showNumber?: boolean
}

/** A tel: link styled as a button. On phones it opens the dialler. */
export function CallButton({ mobile, label, variant = 'call', showNumber = false }: Props) {
  const cls = variant === 'call' ? 'callbtn' : variant
  return (
    <a className={cls} href={`tel:${mobile}`}>
      📞 {label}{showNumber ? `, ${phone(mobile)}` : ''}
    </a>
  )
}
