import { spawnSync } from 'node:child_process'
import { mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { collectRuntimeNotices } from './collect-runtime-notices.mjs'
const root = resolve(import.meta.dirname, '../..')
const command = (exe, args, options = {}) => {
  const result = spawnSync(exe, args, { cwd: root, stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
  shell: process.platform === 'win32',
})
const dotnet = process.env.ALE_DOTNET || 'dotnet'
command(dotnet, [
  'run',
  '--project',
  'desktop/windows/Ale.PolicyTests',
  '--configuration',
  'Release',
])
const output = join(root, 'build', 'releases', 'windows')
// This directory is generated exclusively by this script; clean stale publish assets.
rmSync(output, { recursive: true, force: true })
command(dotnet, [
  'publish',
  'desktop/windows/Ale.Windows',
  '-c',
  'Release',
  '-r',
  'win-x64',
  '--self-contained',
  'true',
  '-o',
  output,
])
const licenses = join(output, 'licenses')
mkdirSync(licenses, { recursive: true })
for (const name of ['react', 'react-dom', 'scheduler']) {
  cpSync(join(root, 'node_modules', name, 'LICENSE'), join(licenses, `${name}-LICENSE.txt`))
  const pkg = JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'))
  writeFileSync(join(licenses, `${name}-version.txt`), `${pkg.name} ${pkg.version}\n`)
}
const nugetRoot =
  process.env.NUGET_PACKAGES ||
  join(process.env.USERPROFILE || process.env.HOME, '.nuget', 'packages')
collectRuntimeNotices({ depsPath: join(output, 'Ale.deps.json'), nugetRoot, output: licenses })
mkdirSync(join(output, 'scripts', 'apple-music'), { recursive: true })
cpSync(
  join(root, 'scripts', 'apple-music', 'developer-token.mjs'),
  join(output, 'scripts', 'apple-music', 'developer-token.mjs'),
)
cpSync(join(root, 'README.md'), join(output, 'README.md'))
mkdirSync(join(output, 'docs'), { recursive: true })
cpSync(join(root, 'docs'), join(output, 'docs'), { recursive: true })
mkdirSync(join(output, '.github'), { recursive: true })
cpSync(join(root, '.github', 'CONTRIBUTING.md'), join(output, '.github', 'CONTRIBUTING.md'))
writeFileSync(
  join(output, 'START-HERE.txt'),
  `ALE 0.1.0 — WINDOWS DEVELOPER PREVIEW

Extract this entire folder before opening Ale.exe. Keep wwwroot and all DLLs together.
Requires Windows 11 x64 and Microsoft WebView2 Evergreen Runtime.
The .NET runtime is included. Administrator access is not required by Ale.

1. Open Ale.exe and choose Open files to try an unprotected audio file you own.
2. For Apple Music, read README.md for local developer-token generation, then use Settings.
3. Sign in only in Apple's window. Never paste a .p8 private key into Ale or chat.

Vibe-code disclaimer: Ale was built with substantial AI assistance and may contain mistakes.
This is an unsigned developer preview, not a tested public release.
Follow Windows and organization security policies; do not disable protections.
Full Apple subscription playback and native Windows runtime behavior still require a test on your PC.
The iPhone remote is a later milestone.

Privacy: docs/legal/privacy.md
Test results and remaining checks: docs/verification.md
Release/legal review: docs/legal/compliance.md
Third-party notices: THIRD_PARTY_NOTICES.md and licenses/
`,
)

console.log(
  `Windows build ready: ${output}. Extract all files and open Ale.exe on Windows 11 with WebView2 Evergreen installed.`,
)
