import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NativeAppleMusicService } from '../../src/player/native.ts'

test('native permission denial never reports a connected account', async () => {
  const service = new NativeAppleMusicService(async () => {
    throw new Error('Permission denied')
  })
  await assert.rejects(service.connect(''), /Permission denied/)
  assert.equal(service.connected, false)
})

test('native playback rejection reaches the caller and disconnect clears connection', async () => {
  const service = new NativeAppleMusicService(async ({ command }) => {
    if (command === 'connect') return { connected: true }
    if (command === 'play') throw new Error('Subscription playback failed')
    return {}
  })
  await service.connect('')
  try {
    await assert.rejects(
      service.play({
        id: '1',
        source: 'apple',
        title: 'Song',
        artist: 'A',
        album: '',
        duration: 10,
      }),
      /Subscription playback failed/,
    )
  } finally {
    await service.disconnect()
  }
  assert.equal(service.connected, false)
})

test('late native ended replies cannot advance a stopped track', async () => {
  let resolveStatus: (value: unknown) => void = () => {}
  const service = new NativeAppleMusicService(async ({ command }) => {
    if (command === 'connect') return { connected: true }
    if (command === 'status')
      return new Promise((resolve) => {
        resolveStatus = resolve
      })
    return {}
  })
  let ended = 0
  service.onEnded = () => {
    ended++
  }
  await service.connect('')
  try {
    const pending = service.refresh()
    await service.stop()
    resolveStatus({ connected: true, playing: false, position: 10, duration: 10, ended: true })
    await pending
    assert.equal(ended, 0)
  } finally {
    await service.disconnect()
  }
})

test('native state delivers position and permission revocation disconnects Ale', async () => {
  let revoked = false
  const service = new NativeAppleMusicService(async ({ command }) =>
    command === 'connect'
      ? { connected: true }
      : { connected: !revoked, playing: !revoked, position: 3, duration: 10, ended: false },
  )
  let position = -1
  let connected = true
  service.onUpdate = (state) => {
    position = state.position
  }
  service.onConnectionChange = (value) => {
    connected = value
  }
  await service.connect('')
  try {
    await service.refresh()
    assert.equal(position, 3)
    revoked = true
    await service.refresh()
    assert.equal(service.connected, false)
    assert.equal(connected, false)
  } finally {
    await service.disconnect()
  }
})

test('native search screens remote artwork and links instead of trusting bridge metadata', async () => {
  const service = new NativeAppleMusicService(async ({ command }) =>
    command === 'connect'
      ? { connected: true }
      : [
          {
            id: '123',
            title: 'Song',
            artist: 'A',
            album: '',
            duration: 10,
            artwork: 'https://evil.test/a.png',
            appleUrl: 'javascript:alert(1)',
          },
        ],
  )
  await service.connect('')
  try {
    const [track] = await service.search('song')
    assert.equal(track.source, 'apple')
    assert.equal(track.artwork, undefined)
    assert.equal(track.appleUrl, undefined)
  } finally {
    await service.disconnect()
  }
})

test('native status collected during playback startup cannot overwrite its completed state', async () => {
  let resolvePlay: (value: unknown) => void = () => {}
  let resolveStatus: (value: unknown) => void = () => {}
  const service = new NativeAppleMusicService(async ({ command }) => {
    if (command === 'connect') return { connected: true }
    if (command === 'play')
      return new Promise((resolve) => {
        resolvePlay = resolve
      })
    if (command === 'status')
      return new Promise((resolve) => {
        resolveStatus = resolve
      })
    return {}
  })
  let updates = 0
  service.onUpdate = () => {
    updates++
  }
  await service.connect('')
  try {
    const play = service.play({
      id: '1',
      source: 'apple',
      title: 'Song',
      artist: 'A',
      album: '',
      duration: 10,
    })
    const status = service.refresh()
    resolvePlay({})
    await play
    resolveStatus({ connected: true, playing: false, position: 0, duration: 10, ended: false })
    await status
    assert.equal(updates, 0)
  } finally {
    await service.disconnect()
  }
})
