import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin') throw new Error('Native Mac checks require macOS and Xcode.')
const root = resolve(import.meta.dirname, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'ale-native-tests-'))
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`)
}
try {
  const executable = join(temporary, 'policy-tests')
  run('xcrun', [
    'swiftc',
    '-module-cache-path',
    join(tmpdir(), 'ale-swift-cache'),
    'desktop/macos/AleMac/NavigationPolicy.swift',
    'desktop/macos/PolicyTests/main.swift',
    '-o',
    executable,
  ])
  run(executable, [])
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
