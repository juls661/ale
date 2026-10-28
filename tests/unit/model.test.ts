import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatTime,
  inspectToken,
  safeAppleUrl,
  safeArtwork,
  nextIndex,
} from '../../src/player/model.ts'

const token = (payload: object) =>
  `${btoa(JSON.stringify({ alg: 'ES256', kid: 'KEY123' }))}.${btoa(JSON.stringify(payload))}.signature`
test('duration display never renders NaN or infinity', () => {
  assert.equal(formatTime(NaN), '0:00')
  assert.equal(formatTime(Infinity), '0:00')
  assert.equal(formatTime(125.7), '2:05')
  assert.equal(formatTime(-3), '0:00')
})
test('expired tokens and private keys are rejected before sending them to Apple', () => {
  assert.throws(() => inspectToken('-----BEGIN PRIVATE KEY-----'), /private key/i)
  assert.throws(() => inspectToken('wrong'), /developer token/i)
  assert.throws(() => inspectToken(token({ exp: 1, iss: 'TEAM' })), /expired/i)
  assert.throws(
    () =>
      inspectToken(
        token({ exp: 4102444800, iss: 'TEAM' }).replace(/^[^.]+/, btoa('{"alg":"none"}')),
      ),
    /ES256/,
  )
  assert.equal(inspectToken(` ${token({ exp: 4102444800, iss: 'TEAM' })} `).split('.').length, 3)
})
test('catalog links cannot inject arbitrary protocols or unrelated domains', () => {
  assert.equal(safeAppleUrl('javascript:alert(1)'), undefined)
  assert.equal(safeAppleUrl('https://music.apple.com.evil.example/song'), undefined)
  assert.equal(
    safeAppleUrl('https://music.apple.com/us/song/1'),
    'https://music.apple.com/us/song/1',
  )
  assert.equal(
    safeArtwork('https://is1-ssl.mzstatic.com/image/{w}x{h}bb.jpg'),
    'https://is1-ssl.mzstatic.com/image/240x240bb.jpg',
  )
  assert.equal(safeArtwork('https://evil.example/a.jpg'), undefined)
})
test('queue boundaries stop at the end unless repeat-all is selected', () => {
  assert.equal(nextIndex(0, 0, false), -1)
  assert.equal(nextIndex(0, 2, false), 1)
  assert.equal(nextIndex(1, 2, false), -1)
  assert.equal(nextIndex(1, 2, true), 0)
})
