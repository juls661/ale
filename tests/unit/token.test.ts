import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { createDeveloperToken } from '../../scripts/apple-music/developer-token.mjs'
test('developer tokens are verifiable ES256 JWTs with bounded expiry', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const token = createDeveloperToken(privateKey, 'TEAM123456', 'KEY1234567', 1000)
  const [header, payload, signature] = token.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString()), {
    alg: 'ES256',
    kid: 'KEY1234567',
  })
  assert.deepEqual(JSON.parse(Buffer.from(payload, 'base64url').toString()), {
    iss: 'TEAM123456',
    iat: 1000,
    exp: 2593000,
  })
  assert.equal(
    verify(
      'sha256',
      Buffer.from(`${header}.${payload}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'),
    ),
    true,
  )
  assert.throws(() => createDeveloperToken(privateKey, '', 'KEY1234567'), /Team ID/)
})
