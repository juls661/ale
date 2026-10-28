import { AppleMusicService } from './musickit.ts'
import { NativeAppleMusicService, nativeBridge } from './native.ts'
import type { Track } from './model.ts'

export type PlaybackUpdate = { playing: boolean; position: number; duration: number }
export interface MusicService {
  readonly nativeAuthorization?: boolean
  readonly connected: boolean
  onUpdate: (state: PlaybackUpdate) => void
  onEnded: () => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: string) => void
  connect(token: string): Promise<void>
  disconnect(): Promise<void>
  search(term: string): Promise<Track[]>
  library(): Promise<Track[]>
  play(track: Track): Promise<void>
  resume(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  seek(time: number): Promise<void>
  volume(value: number): void
}

export function createMusicService(): MusicService {
  const bridge = nativeBridge()
  return bridge
    ? new NativeAppleMusicService((body) => bridge.postMessage(body))
    : new AppleMusicService()
}
