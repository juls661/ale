import { inspectToken, safeAppleUrl, safeArtwork } from './model.ts'
import type { Track } from './model.ts'

type AppleItem = {
  id: string
  attributes?: {
    name?: string
    artistName?: string
    albumName?: string
    durationInMillis?: number
    artwork?: { url?: string }
    url?: string
    playParams?: { id?: string; catalogId?: string }
  }
}
type ApiResult = { data: { results?: { songs?: { data?: AppleItem[] } }; data?: AppleItem[] } }
export type MusicInstance = {
  isAuthorized: boolean
  storefrontId: string
  isPlaying: boolean
  volume: number
  currentPlaybackTime: number
  currentPlaybackDuration: number
  authorize(): Promise<string>
  unauthorize(): Promise<void>
  api: { music(path: string, parameters?: Record<string, string | number>): Promise<ApiResult> }
  setQueue(options: { song: string }): Promise<unknown>
  play(): Promise<unknown>
  pause(): unknown
  stop(): unknown
  seekToTime(time: number): Promise<unknown>
  addEventListener(name: string, listener: (event: { state?: number }) => void): void
  removeEventListener(name: string, listener: (event: { state?: number }) => void): void
}
export type MusicFactory = {
  configure(options: {
    developerToken: string
    app: { name: string; build: string }
  }): Promise<MusicInstance>
  PlaybackStates?: { ended: number; completed: number }
}
declare global {
  interface Window {
    MusicKit?: MusicFactory
    chrome?: { webview?: { postMessage(message: { type: string }): void } }
  }
}
let loading: Promise<MusicFactory> | undefined
export function loadMusicKit(): Promise<MusicFactory> {
  if (window.MusicKit) return Promise.resolve(window.MusicKit)
  if (loading) return loading
  loading = new Promise<MusicFactory>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'
    script.async = true
    const cleanup = () => {
      clearTimeout(timer)
      document.removeEventListener('musickitloaded', ready)
    }
    const ready = () => {
      if (window.MusicKit) {
        cleanup()
        resolve(window.MusicKit)
      }
    }
    const fail = () => {
      cleanup()
      script.remove()
      reject(new Error('Could not load Apple Music. Check your internet connection and try again.'))
    }
    const timer = setTimeout(fail, 20000)
    document.addEventListener('musickitloaded', ready)
    script.onload = ready
    script.onerror = fail
    document.head.appendChild(script)
  }).catch((error) => {
    loading = undefined
    throw error
  })
  return loading
}
function normalize(item: AppleItem): Track | undefined {
  const a = item.attributes
  if (!a?.name || !item.id) return undefined
  return {
    id: a.playParams?.catalogId ?? a.playParams?.id ?? item.id,
    source: 'apple',
    title: a.name,
    artist: a.artistName ?? 'Unknown artist',
    album: a.albumName ?? '',
    duration: Math.max(0, (a.durationInMillis ?? 0) / 1000),
    artwork: safeArtwork(a.artwork?.url),
    appleUrl: safeAppleUrl(a.url),
  }
}
export class AppleMusicService {
  private instance?: MusicInstance
  private authorized = false
  private factory?: MusicFactory
  private loader: () => Promise<MusicFactory>
  private listeners: [string, (event: { state?: number }) => void][] = []
  private ended = false
  onUpdate: (state: { playing: boolean; position: number; duration: number }) => void = () => {}
  onEnded: () => void = () => {}
  constructor(loader: () => Promise<MusicFactory> = loadMusicKit) {
    this.loader = loader
  }
  get connected() {
    return this.authorized && Boolean(this.instance?.isAuthorized)
  }
  async connect(value: string) {
    const developerToken = inspectToken(value)
    this.factory = await this.loader()
    const music = await this.factory.configure({
      developerToken,
      app: { name: 'Ale', build: '0.1.0' },
    })
    try {
      await music.authorize()
      if (!music.isAuthorized) throw new Error('Not authorized')
    } catch {
      this.instance = undefined
      throw new Error(
        'Apple Music sign-in was not completed. Try again and allow the Apple sign-in window.',
      )
    }
    this.removeListeners()
    this.instance = music
    this.authorized = true
    const update = () =>
      this.onUpdate({
        playing: music.isPlaying,
        position: music.currentPlaybackTime || 0,
        duration: music.currentPlaybackDuration || 0,
      })
    const state = (event: { state?: number }) => {
      update()
      const states = this.factory?.PlaybackStates
      if (
        !this.ended &&
        (event.state === (states?.ended ?? 5) || event.state === (states?.completed ?? 10))
      ) {
        this.ended = true
        this.onEnded()
      }
    }
    this.listeners = [
      ['playbackTimeDidChange', update],
      ['playbackStateDidChange', state],
    ]
    for (const [name, listener] of this.listeners) music.addEventListener(name, listener)
  }
  private removeListeners() {
    for (const [name, listener] of this.listeners)
      this.instance?.removeEventListener(name, listener)
    this.listeners = []
  }
  private require() {
    if (!this.connected || !this.instance)
      throw new Error('Connect to Apple Music in Settings first.')
    return this.instance
  }
  async disconnect() {
    const music = this.instance
    this.removeListeners()
    this.authorized = false
    if (music) {
      try {
        await music.stop()
      } finally {
        try {
          await music.unauthorize()
        } finally {
          if (!music.isAuthorized) this.instance = undefined
        }
      }
    }
  }
  async search(term: string): Promise<Track[]> {
    const music = this.require()
    const storefront = music.storefrontId
    if (!/^[a-z]{2}$/i.test(storefront))
      throw new Error('Apple Music did not return your storefront. Reconnect and try again.')
    const result = await music.api.music(`/v1/catalog/${storefront}/search`, {
      term,
      types: 'songs',
      limit: 25,
    })
    return (result.data.results?.songs?.data ?? [])
      .map(normalize)
      .filter((t): t is Track => Boolean(t))
  }
  async library(): Promise<Track[]> {
    const result = await this.require().api.music('/v1/me/library/songs', { limit: 100 })
    // Library IDs require the librarySongs queue option; this milestone uses catalog-backed songs only.
    return (result.data.data ?? [])
      .filter((item) => item.attributes?.playParams?.catalogId)
      .map(normalize)
      .filter((t): t is Track => Boolean(t))
  }
  async play(track: Track) {
    const music = this.require()
    this.ended = false
    await music.setQueue({ song: track.id })
    await music.play()
  }
  async resume() {
    await this.require().play()
  }
  async pause() {
    await this.instance?.pause()
  }
  async stop() {
    await this.instance?.stop()
  }
  async seek(time: number) {
    await this.require().seekToTime(time)
  }
  volume(value: number) {
    if (this.instance) this.instance.volume = value
  }
}
