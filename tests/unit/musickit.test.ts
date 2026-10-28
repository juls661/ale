import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AppleMusicService,
  type MusicInstance,
  type MusicFactory,
} from '../../src/player/musickit.ts'
const jwt = `${btoa('{"alg":"ES256"}')}.${btoa('{"exp":4102444800,"iss":"TEAM"}')}.signed`
function fixture() {
  const requests: string[] = []
  const music = {
    isAuthorized: false,
    storefrontId: 'gb',
    currentPlaybackTime: 0,
    currentPlaybackDuration: 100,
    isPlaying: false,
    volume: 0.5,
    authorize: async () => {
      music.isAuthorized = true
      return 'user-token'
    },
    unauthorize: async () => {
      music.isAuthorized = false
    },
    api: {
      music: async (path: string) => {
        requests.push(path)
        return {
          data: {
            results: {
              songs: {
                data: [
                  {
                    id: '123',
                    attributes: {
                      name: 'Song',
                      artistName: 'Artist',
                      durationInMillis: 100000,
                      url: 'javascript:alert(1)',
                    },
                  },
                ],
              },
            },
            data: [],
          },
        }
      },
    },
    setQueue: async () => {},
    play: async () => {},
    pause: () => {},
    stop: () => {},
    seekToTime: async () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } satisfies MusicInstance
  const factory: MusicFactory = { configure: async () => music }
  return { music, requests, service: new AppleMusicService(async () => factory) }
}
test('bad tokens never load Apple code', async () => {
  let loaded = false
  const service = new AppleMusicService(async () => {
    loaded = true
    throw new Error('should not load')
  })
  await assert.rejects(service.connect('invalid'), /developer token/)
  assert.equal(loaded, false)
})
test('denied authorization leaves the service disconnected', async () => {
  const { music, service } = fixture()
  music.authorize = async () => {
    throw new Error('cancelled')
  }
  await assert.rejects(service.connect(jwt), /Apple Music sign-in/)
  assert.equal(service.connected, false)
  await assert.rejects(service.search('a'), /Connect/)
})
test('search uses authorized storefront and normalizes Apple metadata safely', async () => {
  const { service, requests } = fixture()
  await service.connect(jwt)
  const tracks = await service.search('test')
  assert.deepEqual(requests, ['/v1/catalog/gb/search'])
  assert.equal(tracks[0].title, 'Song')
  assert.equal(tracks[0].duration, 100)
  assert.equal(tracks[0].appleUrl, undefined)
  await service.disconnect()
  assert.equal(service.connected, false)
})
test('SDK setup errors and playback rejection are actionable', async () => {
  const { service, music } = fixture()
  await service.connect(jwt)
  music.play = async () => {
    throw new Error('DRM unavailable')
  }
  await assert.rejects(
    service.play({
      id: '123',
      source: 'apple',
      title: 'Song',
      artist: 'A',
      album: '',
      duration: 100,
    }),
    /DRM unavailable/,
  )
})
test('disconnect attempts deauthorization even when stopping fails', async () => {
  const { service, music } = fixture()
  await service.connect(jwt)
  music.stop = () => {
    throw new Error('Stop failed')
  }
  await assert.rejects(service.disconnect(), /Stop failed/)
  assert.equal(music.isAuthorized, false)
})
