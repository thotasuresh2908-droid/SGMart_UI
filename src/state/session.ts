import { useQuery } from '@tanstack/react-query'
import { getProfile, getSession, getStore } from '../api/shop'

/** Who is signed in. Also makes the backend set the XSRF-TOKEN cookie before any POST. */
export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: getSession, staleTime: 60_000 })
}

/** Signed-in shopper's profile (name, mobile) for pre-filling checkout. */
export function useProfile(enabled: boolean) {
  return useQuery({ queryKey: ['profile'], queryFn: getProfile, enabled, staleTime: 60_000 })
}

/** Store phone, hours, ETA and delivery fee rules. */
export function useStore() {
  return useQuery({ queryKey: ['store'], queryFn: getStore, staleTime: 5 * 60_000 })
}
