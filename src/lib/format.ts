const IST = 'Asia/Kolkata'

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

/** ₹126, ₹126.50, ₹1,210 (Indian digit grouping). */
export function money(amount: number | null | undefined): string {
  if (amount == null) return '–'
  const fixed = Math.round(amount * 100) / 100
  const hasPaise = Math.abs(fixed % 1) > 0.0001
  return '₹' + (hasPaise ? fixed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : rupees.format(fixed))
}

/** 8:42 pm, in India time whatever the device clock zone. */
export function clock(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST })
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST })
}

/** Just now, 5 min ago, 2 hr ago, 12 Nov. */
export function relative(iso: string, now: number = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return shortDate(iso)
}

/** 98765 43210 */
export function phone(mobile: string | null | undefined): string {
  if (!mobile) return ''
  return mobile.length === 10 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile
}

/** "Arriving in 7:42", "Arriving any minute now", "Delivered at 8:42 pm". */
export function etaText(etaIso: string, deliveredAt: string | null, now: number): string {
  if (deliveredAt) return `Delivered at ${clock(deliveredAt)}`
  const ms = new Date(etaIso).getTime() - now
  if (ms <= 0) return 'Arriving any minute now'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `Arriving in ${m}:${String(s).padStart(2, '0')}`
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}
