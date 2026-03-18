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

function run(command) {
  return execSync(command, {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  }).trim()
}

function tagExistsLocally(tagName) {
  try {
    run(`git rev-parse --verify refs/tags/${tagName}`)
    return true
  } catch {
    return false
  }
}

function remoteTagSha(tagName) {
  try {
    const out = run(`git ls-remote --tags origin refs/tags/${tagName}`)
    if (!out) return null
    return out.split(/\s+/)[0] || null
  } catch {
    return null
  }
}

console.log(`Preparing release tag ${tag}...`)

if (!tagExistsLocally(tag)) {
  console.log(`Creating local tag ${tag}...`)
  execSync(`git tag ${tag}`, { cwd: rootDir, stdio: 'inherit' })
} else {
  const tagSha = run(`git rev-list -n 1 ${tag}`)
  const headSha = run('git rev-parse HEAD')
  if (tagSha !== headSha) {
    throw new Error(
      `Tag ${tag} already exists on a different commit (${tagSha.slice(0, 7)}). ` +
        'Please bump version first (pnpm pre-release) or choose a new version.'
    )
  }
  console.log(`Tag ${tag} already exists locally on current commit, continuing...`)
}

const localTagSha = run(`git rev-list -n 1 ${tag}`)
const remoteSha = remoteTagSha(tag)

if (remoteSha && remoteSha !== localTagSha) {
  throw new Error(
    `Remote tag ${tag} already exists and points to a different commit (${remoteSha.slice(0, 7)}). ` +
      'Please bump version before releasing.'
  )
}

if (remoteSha === localTagSha) {
  console.log(`Tag ${tag} is already on origin.`)
} else {
  console.log(`Pushing tag ${tag}...`)
  execSync(`git push origin ${tag}`, { cwd: rootDir, stdio: 'inherit' })
}

console.log(`Release ${tag} pushed.`)
