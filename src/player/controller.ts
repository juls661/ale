import { createMusicService } from './service.ts'
import type { MusicService } from './service.ts'
import { nextIndex } from './model.ts'
import type { Track } from './model.ts'
export type PlayerState = {
  queue: Track[]
  local: Track[]
  index: number
  playing: boolean
  position: number
  duration: number
  volume: number
  repeat: boolean
  shuffle: boolean
  connected: boolean
  busy: boolean
  error: string
  notice: string
}
export class PlayerController {
  private audio: HTMLAudioElement
  private apple: MusicService
  private listeners = new Set<() => void>()
  private playbackEpoch = 0
  private pendingAdvance: number | undefined
  private state: PlayerState = {
    queue: [],
    local: [],
    index: -1,
    playing: false,
    position: 0,
    duration: 0,
    volume: 0.7,
    repeat: false,
    shuffle: false,
    connected: false,
    busy: false,
    error: '',
    notice: '',
  }
  constructor(audio: HTMLAudioElement = new Audio(), apple: MusicService = createMusicService()) {
    this.audio = audio
    this.apple = apple
    this.apple.onConnectionChange = (connected) => this.patch({ connected })
    this.apple.onError = (error) => this.patch({ error })
    const update = () => {
      if (this.current?.source === 'local')
        this.patch({
          playing: !this.audio.paused,
          position: this.audio.currentTime || 0,
          duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
        })
    }
    for (const name of ['timeupdate', 'loadedmetadata', 'play', 'pause', 'durationchange'])
      this.audio.addEventListener(name, update)
    this.audio.addEventListener('ended', () => {
      this.patch({ playing: false })
      void this.next(true)
    })
    this.audio.addEventListener('error', () => {
      if (this.current?.source === 'local')
        this.patch({
          playing: false,
          error:
            'This audio file could not be played. Try an unprotected MP3, WAV, M4A, OGG or FLAC file.',
        })
    })
    this.apple.onUpdate = (state) => {
      if (this.current?.source === 'apple') this.patch(state)
    }
    this.apple.onEnded = () => {
      if (this.current?.source === 'apple') {
        this.patch({ playing: false })
        void this.next(true)
      }
    }
  }
  get current() {
    return this.state.queue[this.state.index]
  }
  snapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private patch(change: Partial<PlayerState>) {
    this.state = { ...this.state, ...change }
    for (const listener of this.listeners) listener()
  }
  dismissError = () => this.patch({ error: '' })
  private async run(action: () => Promise<void>) {
    if (this.state.busy) return
    this.patch({ busy: true, error: '' })
    try {
      await action()
    } catch (error) {
      this.patch({
        error: error instanceof Error ? error.message : 'Something went wrong. Try again.',
        playing: this.current?.source === 'local' ? !this.audio.paused : false,
      })
    } finally {
      this.patch({ busy: false })
      const pending = this.pendingAdvance
      this.pendingAdvance = undefined
      if (pending !== undefined && pending === this.playbackEpoch) void this.next(true)
    }
  }
  private media() {
    if (!('mediaSession' in navigator)) return
    const track = this.current
    navigator.mediaSession.metadata = track
      ? new MediaMetadata({ title: track.title, artist: track.artist, album: track.album })
      : null
    navigator.mediaSession.playbackState = track
      ? this.state.playing
        ? 'playing'
        : 'paused'
      : 'none'
    const actions: [MediaSessionAction, () => void][] = [
      [
        'play',
        () => {
          if (!this.state.playing) void this.toggle()
        },
      ],
      [
        'pause',
        () => {
          if (this.state.playing) void this.toggle()
        },
      ],
      [
        'nexttrack',
        () => {
          void this.next()
        },
      ],
      [
        'previoustrack',
        () => {
          void this.previous()
        },
      ],
    ]
    for (const [name, handler] of actions)
      try {
        navigator.mediaSession.setActionHandler(name, handler)
      } catch {
        /* Runtime may not implement every media action. */
      }
  }
  private async start(index: number) {
    const track = this.state.queue[index]
    if (!track) return
    this.playbackEpoch++
    this.audio.pause()
    await this.apple.stop()
    this.patch({ index, position: 0, duration: track.duration, playing: false })
    if (track.source === 'local') {
      this.audio.src = track.objectUrl ?? ''
      this.audio.volume = this.state.volume
      await this.audio.play()
    } else {
      this.apple.volume(this.state.volume)
      await this.apple.play(track)
    }
    this.patch({ playing: true })
    this.media()
  }
  play = (track: Track) =>
    this.run(async () => {
      let index = this.state.queue.findIndex((t) => t.id === track.id && t.source === track.source)
      if (index < 0) {
        index = this.state.queue.length
        this.patch({ queue: [...this.state.queue, track] })
      }
      await this.start(index)
    })
  playAt = (index: number) => this.run(() => this.start(index))
  toggle = () =>
    this.run(async () => {
      if (!this.current) {
        if (this.state.queue.length) await this.start(0)
        return
      }
      if (this.state.playing) {
        if (this.current.source === 'local') this.audio.pause()
        else await this.apple.pause()
        this.patch({ playing: false })
      } else {
        if (this.current.source === 'local') await this.audio.play()
        else await this.apple.resume()
        this.patch({ playing: true })
      }
      this.media()
    })
  next = (automatic = false) => {
    if (automatic && this.state.busy) {
      this.pendingAdvance = this.playbackEpoch
      return Promise.resolve()
    }
    return this.run(async () => {
      let index = nextIndex(this.state.index, this.state.queue.length, this.state.repeat)
      if (this.state.shuffle && this.state.queue.length > 1) {
        const offset = 1 + Math.floor(Math.random() * (this.state.queue.length - 1))
        index = (this.state.index + offset) % this.state.queue.length
      }
      if (index >= 0) await this.start(index)
      else if (automatic) {
        this.patch({ playing: false })
        this.media()
      }
    })
  }
  previous = () =>
    this.run(async () => {
      if (this.state.position > 3) {
        if (this.current?.source === 'local') this.audio.currentTime = 0
        else await this.apple.seek(0)
        this.patch({ position: 0 })
      } else if (this.state.index > 0) await this.start(this.state.index - 1)
    })
  seek = (value: number) =>
    this.run(async () => {
      if (!this.current || !Number.isFinite(value)) return
      const position = Math.max(0, Math.min(this.state.duration, value))
      if (this.current.source === 'local') this.audio.currentTime = position
      else await this.apple.seek(position)
      this.patch({ position })
    })
  setVolume = (value: number) => {
    if (!Number.isFinite(value)) return
    const volume = Math.max(0, Math.min(1, value))
    this.audio.volume = volume
    this.apple.volume(volume)
    this.patch({ volume })
  }
  toggleRepeat = () => this.patch({ repeat: !this.state.repeat })
  toggleShuffle = () => this.patch({ shuffle: !this.state.shuffle })
  add = (track: Track) =>
    this.patch({
      queue: [...this.state.queue, track],
      notice: `Added ${track.title} to the queue.`,
    })
  importFiles = (files: File[]) => {
    const accepted = files
      .slice(0, 500)
      .filter((f) => f.size > 0 && /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name))
    const tracks: Track[] = accepted.map((file) => ({
      id:
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
              byte.toString(16).padStart(2, '0'),
            ).join(''),
      source: 'local',
      title: file.name.replace(/\.[^.]+$/, ''),
      artist: 'Local file',
      album: 'On this device',
      duration: 0,
      objectUrl: URL.createObjectURL(file),
    }))
    this.patch({
      local: [...this.state.local, ...tracks],
      queue: [...this.state.queue, ...tracks],
      notice: `Added ${tracks.length} local ${tracks.length === 1 ? 'file' : 'files'}.`,
      error:
        accepted.length < files.length
          ? 'Some files were skipped. Choose up to 500 nonempty MP3, WAV, M4A, AAC, OGG or FLAC files.'
          : '',
    })
  }
  clearQueue = () =>
    this.run(async () => {
      this.playbackEpoch++
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
      await this.apple.stop()
      this.patch({
        queue: [],
        index: -1,
        playing: false,
        position: 0,
        duration: 0,
        notice: 'Queue cleared.',
      })
      this.media()
    })
  connect = (token: string) =>
    this.run(async () => {
      await this.apple.connect(token)
      this.patch({ connected: true, notice: 'Connected to Apple Music.' })
    })
  disconnect = () =>
    this.run(async () => {
      try {
        await this.apple.disconnect()
      } finally {
        this.patch({
          connected: false,
          ...(this.current?.source === 'apple' ? { playing: false } : {}),
          notice: this.apple.nativeAuthorization
            ? 'Disconnected from Ale. macOS retains Apple Music permission; revoke it in System Settings.'
            : 'Disconnected from Ale. Apple may retain a browser sign-in session.',
        })
      }
    })
  search = (term: string) => this.apple.search(term)
  library = () => this.apple.library()
  reset = () =>
    this.run(async () => {
      this.playbackEpoch++
      this.audio.pause()
      this.audio.removeAttribute('src')
      this.audio.load()
      let disconnectFailed = false
      try {
        await this.apple.disconnect()
      } catch {
        disconnectFailed = true
      }
      for (const track of this.state.local)
        if (track.objectUrl) URL.revokeObjectURL(track.objectUrl)
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {
        /* Storage may be unavailable in private browsing. */
      }
      this.patch({
        queue: [],
        local: [],
        index: -1,
        playing: false,
        position: 0,
        duration: 0,
        connected: false,
        notice: this.apple.nativeAuthorization
          ? 'Ale data cleared. macOS retains Apple Music permission; revoke it in System Settings.'
          : 'Ale data cleared. Apple may retain its browser sign-in session.',
        error: disconnectFailed
          ? this.apple.nativeAuthorization
            ? 'Apple Music could not confirm playback stopped. Close Ale and check the Music app.'
            : 'Apple could not confirm sign-out. Clear the desktop browser profile or sign out at music.apple.com.'
          : '',
      })
      this.media()
    })
}
