/**
 * A short two-tone chime for new orders, made with the Web Audio API (no sound file).
 * Browsers only allow sound after the admin has clicked something on the page, so the
 * "Sound on" toggle also unlocks audio.
 */
let ctx: AudioContext | null = null

export function unlockSound(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

export function playNewOrderChime(): void {
  if (!ctx || ctx.state !== 'running') return
  const start = ctx.currentTime
  ;[880, 1175].forEach((freq, i) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.0001, start + i * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.25, start + i * 0.18 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.18 + 0.16)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(start + i * 0.18)
    osc.stop(start + i * 0.18 + 0.17)
  })
}
