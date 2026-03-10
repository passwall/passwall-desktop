import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const pkgPath = join(rootDir, 'package.json')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const version = pkg.version
const tag = `v${version}`

console.log(`Creating tag ${tag}...`)
execSync(`git tag ${tag}`, { cwd: rootDir, stdio: 'inherit' })

console.log(`Pushing tag ${tag}...`)
execSync(`git push origin ${tag}`, { cwd: rootDir, stdio: 'inherit' })

console.log(`Release ${tag} pushed.`)
