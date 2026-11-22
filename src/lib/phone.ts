/**
 * Same rule as the backend (PhoneNumbers.java): 10 digits starting with 6-9.
 * Accepts "98480 12345", "+91 98480-12345", "098480 12345". Returns null when invalid.
 */
export function normalizeMobile(input: string | null | undefined): string | null {
  let digits = (input ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}
