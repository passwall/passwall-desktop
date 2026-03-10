import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const pkgPath = join(rootDir, 'package.json')

console.log('Running lint...')
execSync('pnpm lint', { cwd: rootDir, stdio: 'inherit' })

console.log('Running format...')
execSync('pnpm format', { cwd: rootDir, stdio: 'inherit' })

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const [major, minor] = pkg.version.split('.').map(Number)
const newVersion = `${major}.${minor + 1}.0`

pkg.version = newVersion
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`Bumped version to ${newVersion}`)

console.log('Staging changes...')
execSync('git add .', { cwd: rootDir, stdio: 'inherit' })

console.log('Committing...')
execSync(`git commit -m "chore: release v${newVersion}"`, {
  cwd: rootDir,
  stdio: 'inherit'
})

console.log('Pushing...')
execSync('git push', { cwd: rootDir, stdio: 'inherit' })

console.log(`Pre-release done. Version ${newVersion} committed and pushed.`)
