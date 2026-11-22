/** Cloudflare Turnstile site key (public). Empty = no "I'm not a robot" check (local development). */
export const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

export const captchaEnabled = Boolean(SITE_KEY)
