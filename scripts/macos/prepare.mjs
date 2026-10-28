import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const output = join(root, 'build', 'macos', 'resources')
// Generated resources are copied by Xcode's standard resource phase, with no custom shell phase.
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
cpSync(join(root, 'build', 'web'), join(output, 'wwwroot'), { recursive: true })
cpSync(join(root, 'desktop', 'macos', 'AleMac', 'Ale.icns'), join(output, 'Ale.icns'))
const licenses = join(output, 'licenses')
mkdirSync(licenses)
for (const name of ['react', 'react-dom', 'scheduler']) {
  cpSync(join(root, 'node_modules', name, 'LICENSE'), join(licenses, `${name}-LICENSE.txt`))
  const pkg = JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'))
  writeFileSync(join(licenses, `${name}-version.txt`), `${pkg.name} ${pkg.version}\n`)
}
cpSync(join(root, 'THIRD_PARTY_NOTICES.md'), join(output, 'THIRD_PARTY_NOTICES.md'))
cpSync(join(root, 'docs', 'legal', 'privacy.md'), join(output, 'PRIVACY.md'))
console.log('Mac resources prepared. You can now build Ale in Xcode.')
