import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

if (process.platform !== 'darwin')
  throw new Error('The Mac app must be built on macOS with Xcode installed.')
const root = resolve(import.meta.dirname, '../..')
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status}); the Mac package is incomplete.`)
}
run('npm', ['run', 'macos:prepare'])
run('npm', ['run', 'macos:test'])
const output = join(root, 'build', 'releases', 'macos')
rmSync(output, { recursive: true, force: true })
const app = join(output, 'Ale.app')
const contents = join(app, 'Contents')
const resources = join(contents, 'Resources')
const binaries = join(contents, 'MacOS')
mkdirSync(binaries, { recursive: true })
mkdirSync(resources, { recursive: true })
const sourceRoot = join(root, 'desktop', 'macos', 'AleMac')
const sources = readdirSync(sourceRoot)
  .filter((name) => name.endsWith('.swift'))
  .map((name) => join(sourceRoot, name))
for (const arch of ['arm64', 'x86_64']) {
  run('xcrun', [
    'swiftc',
    '-parse-as-library',
    '-O',
    '-warnings-as-errors',
    '-module-cache-path',
    join(tmpdir(), 'ale-swift-cache'),
    '-target',
    `${arch}-apple-macos14.0`,
    ...sources,
    '-o',
    join(output, `Ale-${arch}`),
  ])
}
run('xcrun', [
  'lipo',
  '-create',
  join(output, 'Ale-arm64'),
  join(output, 'Ale-x86_64'),
  '-output',
  join(binaries, 'Ale'),
])
for (const arch of ['arm64', 'x86_64']) rmSync(join(output, `Ale-${arch}`))
writeFileSync(
  join(contents, 'Info.plist'),
  readFileSync(join(sourceRoot, 'Info.plist'), 'utf8').replaceAll(
    '$(PRODUCT_BUNDLE_IDENTIFIER)',
    'com.ale.player.development',
  ),
)
cpSync(join(root, 'build', 'macos', 'resources'), resources, { recursive: true })
run('codesign', [
  '--force',
  '--sign',
  '-',
  '--options',
  'runtime',
  '--entitlements',
  join(sourceRoot, 'AleMac.entitlements'),
  app,
])
run('codesign', ['--verify', '--strict', '--verbose=2', app])
writeFileSync(
  join(output, 'START-HERE.txt'),
  `Ale — macOS 14+ developer preview (Apple silicon and Intel)\n\nOpen Ale.app and select audio files you have the right to play.\nThis local build is ad-hoc signed, not notarized for distribution.\nNative Apple Music requires your own registered bundle identifier, MusicKit App Service and Apple development signing in Xcode.\nSee docs/guides/macos.md in the repository for setup and known limits.\nNever disable Gatekeeper or share a private signing key.\n`,
)
console.log(`Mac developer build: ${app}`)
