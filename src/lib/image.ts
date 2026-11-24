/** Largest upload the backend accepts. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/**
 * Shrinks a phone photo before upload: longest side 1200 px, saved as JPEG on white.
 * Uploads stay well under 5 MB and finish fast on mobile data. The backend still checks
 * and resizes again to 600 px. If the browser can't decode it, the original file is sent.
 */
export async function shrinkPhoto(file: File, maxSide = 1200): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP photo.')
  }
  let result: Blob = file
  if (typeof createImageBitmap === 'function' && typeof document !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
        if (blob) result = blob
      }
    } catch {
      result = file
    }
  }
  if (result.size > MAX_UPLOAD_BYTES) {
    throw new Error('The photo is larger than 5 MB. Choose a smaller one.')
  }
  return result
}
