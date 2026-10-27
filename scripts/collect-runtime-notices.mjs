import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

// Read the published dependency manifest, not the SDK version or a guessed latest package.
export function collectRuntimeNotices({ depsPath, nugetRoot, output }) {
  const { libraries } = JSON.parse(readFileSync(depsPath, 'utf8'))
  const requirements = [
    {
      dependency: 'runtimepack.Microsoft.NETCore.App.Runtime.win-x64',
      package: 'microsoft.netcore.app.runtime.win-x64',
      prefix: 'dotnet-runtime',
      files: ['LICENSE.TXT', 'THIRD-PARTY-NOTICES.TXT'],
    },
    {
      dependency: 'runtimepack.Microsoft.WindowsDesktop.App.Runtime.win-x64',
      package: 'microsoft.windowsdesktop.app.runtime.win-x64',
      prefix: 'dotnet-windowsdesktop',
      files: ['LICENSE'],
    },
    {
      dependency: 'Microsoft.Web.WebView2',
      package: 'microsoft.web.webview2',
      prefix: 'WebView2',
      files: ['LICENSE.txt', 'NOTICE.txt'],
    },
  ]
  const entries = requirements.map((requirement) => {
    const key = Object.keys(libraries).find((name) => name.startsWith(`${requirement.dependency}/`))
    if (!key) throw new Error(`Published dependency missing: ${requirement.dependency}`)
    const version = key.slice(requirement.dependency.length + 1)
    if (!/^[0-9][0-9A-Za-z.+-]*$/.test(version))
      throw new Error('Invalid published dependency version')
    const files = requirement.files.map((name) => {
      const source = join(nugetRoot, requirement.package, version, name)
      if (!existsSync(source))
        throw new Error(
          `Required license/notice missing: ${requirement.package}/${version}/${name}`,
        )
      return { source, name: `${requirement.prefix}-${name}` }
    })
    return { component: requirement.dependency.replace(/^runtimepack\./, ''), version, files }
  })
  mkdirSync(output, { recursive: true })
  const manifest = entries.map((entry) => ({
    component: entry.component,
    version: entry.version,
    files: entry.files.map((file) => {
      cpSync(file.source, join(output, file.name))
      return {
        name: file.name,
        sha256: createHash('sha256').update(readFileSync(file.source)).digest('hex'),
      }
    }),
  }))
  writeFileSync(
    join(output, 'native-license-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
  return manifest
}
