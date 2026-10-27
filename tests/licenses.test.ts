import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectRuntimeNotices } from '../scripts/collect-runtime-notices.mjs'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'ale-license-test-'))
  const nuget = join(root, 'nuget'),
    output = join(root, 'licenses'),
    depsPath = join(root, 'Ale.deps.json')
  const libraries = {
    'runtimepack.Microsoft.NETCore.App.Runtime.win-x64/10.0.14': {},
    'runtimepack.Microsoft.WindowsDesktop.App.Runtime.win-x64/10.0.14': {},
    'Microsoft.Web.WebView2/1.0.4314.35': {},
  }
  writeFileSync(depsPath, JSON.stringify({ libraries }))
  const files = [
    ['microsoft.netcore.app.runtime.win-x64', '10.0.14', 'LICENSE.TXT', 'Actual runtime license'],
    [
      'microsoft.netcore.app.runtime.win-x64',
      '10.0.14',
      'THIRD-PARTY-NOTICES.TXT',
      'Version 10.0.14 third-party notices including zlib-ng',
    ],
    [
      'microsoft.windowsdesktop.app.runtime.win-x64',
      '10.0.14',
      'LICENSE',
      'Windows Desktop runtime license',
    ],
    ['microsoft.web.webview2', '1.0.4314.35', 'LICENSE.txt', 'WebView2 SDK license'],
    ['microsoft.web.webview2', '1.0.4314.35', 'NOTICE.txt', 'WebView2 notices'],
  ]
  for (const [name, version, file, contents] of files) {
    const dir = join(nuget, name, version)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, file), contents)
  }
  return { root, nugetRoot: nuget, output, depsPath }
}
test('packaging copies exact published runtime notices rather than SDK notices', () => {
  const f = fixture()
  try {
    collectRuntimeNotices(f)
    assert.equal(
      readFileSync(join(f.output, 'dotnet-runtime-THIRD-PARTY-NOTICES.TXT'), 'utf8'),
      'Version 10.0.14 third-party notices including zlib-ng',
    )
    assert.equal(
      readFileSync(join(f.output, 'dotnet-windowsdesktop-LICENSE'), 'utf8'),
      'Windows Desktop runtime license',
    )
    const manifest = JSON.parse(
      readFileSync(join(f.output, 'native-license-manifest.json'), 'utf8'),
    )
    assert.equal(manifest[0].version, '10.0.14')
    assert.equal(manifest[2].version, '1.0.4314.35')
    assert.ok(
      manifest.every((entry: { files: { sha256: string }[] }) =>
        entry.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256)),
      ),
    )
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})
test('a build fails closed when a runtime third-party notice is missing', () => {
  const f = fixture()
  try {
    rmSync(
      join(
        f.nugetRoot,
        'microsoft.netcore.app.runtime.win-x64',
        '10.0.14',
        'THIRD-PARTY-NOTICES.TXT',
      ),
    )
    assert.throws(() => collectRuntimeNotices(f), /Required license\/notice missing/)
    assert.equal(existsSync(join(f.output, 'native-license-manifest.json')), false)
  } finally {
    rmSync(f.root, { recursive: true, force: true })
  }
})
