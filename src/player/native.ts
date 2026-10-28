import { safeAppleUrl, safeArtwork } from './model.ts'
import type { Track } from './model.ts'
import type { MusicService, PlaybackUpdate } from './service.ts'

export type NativeRequest = { command: string; term?: string; id?: string; time?: number }
export type NativeBridge = { postMessage(body: NativeRequest): Promise<unknown> }
declare global {
  interface Window {
    webkit?: { messageHandlers?: { aleNative?: NativeBridge } }
  }
}

export function nativeBridge(): NativeBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.webkit?.messageHandlers?.aleNative
}

type Request = (body: NativeRequest) => Promise<unknown>
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('The Mac player returned an invalid response. Reopen Ale and try again.')
  return value as Record<string, unknown>
}
function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

export class NativeAppleMusicService implements MusicService {
  readonly nativeAuthorization = true
  private authorized = false
  private generation = 0
  private timer?: ReturnType<typeof setTimeout>
  private request: Request
  onUpdate: (state: PlaybackUpdate) => void = () => {}
  onEnded: () => void = () => {}
  onConnectionChange: (connected: boolean) => void = () => {}
  onError: (error: string) => void = () => {}

  constructor(request: Request) {
    this.request = request
  }
  get connected() {
    return this.authorized
  }

  private async send(body: NativeRequest) {
    try {
      return await this.request(body)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error))
    }
  }
  private schedule() {
    clearTimeout(this.timer)
    if (!this.authorized) return
    this.timer = setTimeout(() => {
      void this.refresh()
        .catch((error: Error) => this.onError(error.message))
        .finally(() => this.schedule())
    }, 500)
  }
  async connect(token: string) {
    void token
    const response = record(await this.send({ command: 'connect' }))
    if (response.connected !== true) throw new Error('Apple Music access was not granted.')
    this.authorized = true
    this.generation++
    this.onConnectionChange(true)
    this.schedule()
  }
  async disconnect() {
    this.authorized = false
    this.generation++
    clearTimeout(this.timer)
    this.onConnectionChange(false)
    await this.send({ command: 'disconnect' })
  }
  private require() {
    if (!this.authorized) throw new Error('Connect to Apple Music in Settings first.')
  }
  private async tracks(body: NativeRequest): Promise<Track[]> {
    this.require()
    const result = await this.send(body)
    if (!Array.isArray(result)) throw new Error('The Mac player could not read these songs.')
    return result.flatMap((value: unknown) => {
      const item = record(value)
      if (typeof item.id !== 'string' || typeof item.title !== 'string') return []
      return [
        {
          id: item.id,
          source: 'apple' as const,
          title: item.title,
          artist: typeof item.artist === 'string' ? item.artist : 'Unknown artist',
          album: typeof item.album === 'string' ? item.album : '',
          duration: number(item.duration),
          artwork: safeArtwork(typeof item.artwork === 'string' ? item.artwork : undefined),
          appleUrl: safeAppleUrl(typeof item.appleUrl === 'string' ? item.appleUrl : undefined),
        },
      ]
    })
  }
  search(term: string) {
    return this.tracks({ command: 'search', term })
  }
  library() {
    return this.tracks({ command: 'library' })
  }
  private async mutate(body: NativeRequest) {
    this.generation++
    try {
      await this.send(body)
    } finally {
      // Also discard snapshots sampled while a native operation was awaiting its result.
      this.generation++
    }
  }
  async play(track: Track) {
    this.require()
    await this.mutate({ command: 'play', id: track.id })
  }
  async resume() {
    this.require()
    await this.mutate({ command: 'resume' })
  }
  async pause() {
    await this.mutate({ command: 'pause' })
  }
  async stop() {
    await this.mutate({ command: 'stop' })
  }
  async seek(time: number) {
    this.require()
    await this.mutate({ command: 'seek', time })
  }
  volume(value: number) {
    void value /* Native MusicKit uses the Mac's volume controls. */
  }

  async refresh() {
    if (!this.authorized) return
    const generation = this.generation
    const state = record(await this.send({ command: 'status' }))
    if (generation !== this.generation || !this.authorized) return
    if (state.connected !== true) {
      this.authorized = false
      clearTimeout(this.timer)
      this.onConnectionChange(false)
      this.onUpdate({ playing: false, position: 0, duration: 0 })
      return
    }
    this.onUpdate({
      playing: state.playing === true,
      position: number(state.position),
      duration: number(state.duration),
    })
    if (state.ended === true) this.onEnded()
  }
}
