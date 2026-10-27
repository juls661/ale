export type Track = {
  id: string
  source: 'local' | 'apple'
  title: string
  artist: string
  album: string
  duration: number
  artwork?: string
  appleUrl?: string
  objectUrl?: string
}

export function formatTime(value: number): string {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function inspectToken(value: string): string {
  const token = value.trim()
  if (/PRIVATE KEY/.test(token))
    throw new Error('Use a signed developer token, never a private key.')
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts.every(Boolean)) throw new Error()
    const decode = (part: string) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    const header = decode(parts[0])
    const payload = decode(parts[1])
    if (header.alg !== 'ES256') throw new Error('Developer tokens must use ES256.')
    if (typeof payload.exp !== 'number' || typeof payload.iss !== 'string') throw new Error()
    if (payload.exp * 1000 <= Date.now())
      throw new Error('This developer token has expired. Generate a new one.')
    return token
  } catch (error) {
    if (error instanceof Error && /ES256|expired/.test(error.message)) throw error
    throw new Error('Enter a valid Apple Music developer token (a signed JWT).')
  }
}

export function safeAppleUrl(value?: string): string | undefined {
  try {
    const url = new URL(value ?? '')
    return url.protocol === 'https:' &&
      url.hostname === 'music.apple.com' &&
      !url.username &&
      !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

export function safeArtwork(value?: string): string | undefined {
  try {
    const url = new URL((value ?? '').replaceAll('{w}', '240').replaceAll('{h}', '240'))
    return url.protocol === 'https:' &&
      url.hostname.endsWith('.mzstatic.com') &&
      !url.username &&
      !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

export function nextIndex(current: number, count: number, repeat: boolean): number {
  if (count <= 0) return -1
  if (current + 1 < count) return current + 1
  return repeat ? 0 : -1
}
