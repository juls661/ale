import { sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
export function createDeveloperToken(
  privateKey,
  teamId,
  keyId,
  now = Math.floor(Date.now() / 1000),
) {
  if (!/^[A-Z0-9]{10}$/.test(teamId))
    throw new Error('Team ID must contain 10 uppercase letters or digits.')
  if (!/^[A-Z0-9]{10}$/.test(keyId))
    throw new Error('Key ID must contain 10 uppercase letters or digits.')
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const data = `${encode({ alg: 'ES256', kid: keyId })}.${encode({ iss: teamId, iat: now, exp: now + 30 * 24 * 60 * 60 })}`
  const signature = sign('sha256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url')
  return `${data}.${signature}`
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [teamId, keyId, keyPath] = process.argv.slice(2)
  if (!keyPath) {
    console.error(
      'Usage: node scripts/apple-music/developer-token.mjs TEAM_ID KEY_ID /absolute/path/to/AuthKey.p8',
    )
    process.exit(1)
  }
  try {
    console.log(createDeveloperToken(readFileSync(keyPath, 'utf8'), teamId, keyId))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not create developer token.')
    process.exit(1)
  }
}
