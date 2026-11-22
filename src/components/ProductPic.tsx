/** Product photo when there is one, otherwise its icon. */
export function ProductPic({ imageUrl, icon, name }: { imageUrl: string | null; icon: string; name?: string }) {
  return imageUrl ? <img src={imageUrl} alt={name ?? ''} loading="lazy" /> : <>{icon}</>
}
