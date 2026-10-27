import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PlayerController } from '../src/player/controller.ts'
import { AppleMusicService, type MusicInstance } from '../src/player/musickit.ts'
class FakeAudio extends EventTarget {
  paused = true
  currentTime = 0
  duration = 10
  volume = 0.7
  src = ''
  async play() {
    this.paused = false
    this.dispatchEvent(new Event('play'))
  }
  pause() {
    this.paused = true
    this.dispatchEvent(new Event('pause'))
  }
  removeAttribute() {
    this.src = ''
  }
  load() {}
}
function fixture() {
  let resolveAuth: () => void = () => {}
  let delayAuth = false
  let startedVolume = -1
  const music = {
    isAuthorized: false,
    storefrontId: 'us',
    isPlaying: false,
    currentPlaybackTime: 0,
    currentPlaybackDuration: 10,
    volume: 1,
    authorize: async () => {
      if (delayAuth)
        await new Promise<void>((r) => {
          resolveAuth = r
        })
      music.isAuthorized = true
      return 'user'
    },
    unauthorize: async () => {
      music.isAuthorized = false
    },
    api: { music: async () => ({ data: {} }) },
    setQueue: async () => {},
    play: async () => {
      startedVolume = music.volume
    },
    pause: () => {},
    stop: () => {},
    seekToTime: async () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } satisfies MusicInstance
  const audio = new FakeAudio()
  const apple = new AppleMusicService(async () => ({ configure: async () => music }))
  const controller = new PlayerController(audio as unknown as HTMLAudioElement, apple)
  return {
    audio,
    controller,
    music,
    delay: () => {
      delayAuth = true
    },
    release: () => resolveAuth(),
    startedVolume: () => startedVolume,
  }
}
const jwt = `${btoa('{"alg":"ES256"}')}.${btoa('{"exp":4102444800,"iss":"TEAM"}')}.signed`
test('automatic advance waits for a pending connection instead of dropping the next track', async () => {
  const { audio, controller, delay, release } = fixture()
  await controller.play({
    id: '1',
    title: 'First',
    artist: 'Local',
    album: '',
    source: 'local',
    objectUrl: 'blob:first',
    duration: 10,
  })
  controller.add({
    id: '2',
    title: 'Second',
    artist: 'Local',
    album: '',
    source: 'local',
    objectUrl: 'blob:second',
    duration: 10,
  })
  delay()
  const connecting = controller.connect(jwt)
  await new Promise((r) => setImmediate(r))
  audio.paused = true
  audio.dispatchEvent(new Event('ended'))
  release()
  await connecting
  await new Promise((r) => setImmediate(r))
  assert.equal(controller.snapshot().index, 1)
  assert.equal(controller.snapshot().playing, true)
})
test('Apple playback begins at the selected volume, including mute', async () => {
  const { controller, startedVolume } = fixture()
  controller.setVolume(0)
  await controller.connect(jwt)
  await controller.play({
    id: '123',
    title: 'Song',
    artist: 'Artist',
    album: '',
    duration: 10,
    source: 'apple',
  })
  assert.equal(startedVolume(), 0)
})
test('invalid connection does not falsely pause local playback', async () => {
  const { controller } = fixture()
  await controller.play({
    id: '1',
    title: 'Local',
    artist: 'A',
    album: '',
    duration: 10,
    source: 'local',
    objectUrl: 'blob:test',
  })
  await controller.connect('invalid')
  assert.equal(controller.snapshot().playing, true)
})

test('OS play and pause commands are idempotent', async () => {
  const handlers = new Map<string, () => void>()
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: {
      metadata: null,
      playbackState: 'none',
      setActionHandler: (name: string, fn: () => void) => handlers.set(name, fn),
    },
  })
  Object.defineProperty(globalThis, 'MediaMetadata', {
    configurable: true,
    value: class {
      constructor() {}
    },
  })
  try {
    const { controller, audio } = fixture()
    await controller.play({
      id: '1',
      title: 'Local',
      artist: 'A',
      album: '',
      duration: 10,
      source: 'local',
      objectUrl: 'blob:test',
    })
    handlers.get('pause')?.()
    await new Promise((r) => setImmediate(r))
    handlers.get('pause')?.()
    await new Promise((r) => setImmediate(r))
    assert.equal(audio.paused, true)
    handlers.get('play')?.()
    await new Promise((r) => setImmediate(r))
    handlers.get('play')?.()
    await new Promise((r) => setImmediate(r))
    assert.equal(audio.paused, false)
  } finally {
    Reflect.deleteProperty(navigator, 'mediaSession')
    Reflect.deleteProperty(globalThis, 'MediaMetadata')
  }
})
