#!/usr/bin/env node

/**
 * Registers the native messaging host manifest for Chrome/Chromium and Firefox.
 *
 * Run after install (electron-builder afterInstall hook) or manually:
 *   node scripts/install-native-host.js --binary-path /path/to/passwall
 *
 * This creates the JSON manifest in the correct OS-specific directory and,
 * on Windows, writes the required registry key.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const HOST_NAME = 'com.passwall.desktop'

// Placeholder IDs — replaced at build time or manually configured
const CHROME_EXTENSION_ID =
  process.env.PASSWALL_CHROME_EXTENSION_ID || 'blaiihhmnjllkfnkmkidahhegbmlghmo'
const FIREFOX_EXTENSION_ID = process.env.PASSWALL_FIREFOX_EXTENSION_ID || 'passwall@passwall.io'

function getBinaryPath() {
  const idx = process.argv.indexOf('--binary-path')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]

  if (process.platform === 'darwin') {
    return '/Applications/Passwall.app/Contents/MacOS/Passwall'
  }
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Passwall', 'Passwall.exe')
  }
  return '/usr/bin/passwall'
}

function getChromeManifestDirs() {
  const home = os.homedir()
  const dirs = []

  if (process.platform === 'darwin') {
    dirs.push(path.join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts'))
    dirs.push(path.join(home, 'Library/Application Support/Chromium/NativeMessagingHosts'))
  } else if (process.platform === 'linux') {
    dirs.push(path.join(home, '.config/google-chrome/NativeMessagingHosts'))
    dirs.push(path.join(home, '.config/chromium/NativeMessagingHosts'))
  }

  return dirs
}

function getFirefoxManifestDirs() {
  const home = os.homedir()
  const dirs = []

  if (process.platform === 'darwin') {
    dirs.push(path.join(home, 'Library/Application Support/Mozilla/NativeMessagingHosts'))
  } else if (process.platform === 'linux') {
    dirs.push(path.join(home, '.mozilla/native-messaging-hosts'))
  }

  return dirs
}

function buildChromeManifest(binaryPath) {
  return JSON.stringify(
    {
      name: HOST_NAME,
      description: 'Passwall Desktop — secure key storage for the Passwall browser extension',
      path: binaryPath,
      args: ['--native-messaging'],
      type: 'stdio',
      allowed_origins: [`chrome-extension://${CHROME_EXTENSION_ID}/`]
    },
    null,
    2
  )
}

function buildFirefoxManifest(binaryPath) {
  return JSON.stringify(
    {
      name: HOST_NAME,
      description: 'Passwall Desktop — secure key storage for the Passwall browser extension',
      path: binaryPath,
      args: ['--native-messaging'],
      type: 'stdio',
      allowed_extensions: [FIREFOX_EXTENSION_ID]
    },
    null,
    2
  )
}

function writeManifest(dir, content) {
  fs.mkdirSync(dir, { recursive: true })
  const manifestPath = path.join(dir, `${HOST_NAME}.json`)
  fs.writeFileSync(manifestPath, content, 'utf8')
  console.log(`  Wrote: ${manifestPath}`)
}

function installWindows(binaryPath) {
  const { execSync } = require('child_process')

  // Write Chrome manifest next to the executable
  const manifestDir = path.dirname(binaryPath)
  const manifestPath = path.join(manifestDir, `${HOST_NAME}.json`)
  fs.writeFileSync(manifestPath, buildChromeManifest(binaryPath), 'utf8')
  console.log(`  Wrote: ${manifestPath}`)

  // Register in HKCU
  const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`
  try {
    execSync(`reg add "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`, { stdio: 'pipe' })
    console.log(`  Registry: ${regKey}`)
  } catch (err) {
    console.error(`  Failed to write registry: ${err.message}`)
  }

  // Firefox manifest
  const firefoxManifestPath = path.join(manifestDir, `${HOST_NAME}.firefox.json`)
  fs.writeFileSync(firefoxManifestPath, buildFirefoxManifest(binaryPath), 'utf8')
  console.log(`  Wrote: ${firefoxManifestPath}`)

  const firefoxRegKey = `HKCU\\Software\\Mozilla\\NativeMessagingHosts\\${HOST_NAME}`
  try {
    execSync(`reg add "${firefoxRegKey}" /ve /t REG_SZ /d "${firefoxManifestPath}" /f`, {
      stdio: 'pipe'
    })
    console.log(`  Registry: ${firefoxRegKey}`)
  } catch (err) {
    console.error(`  Failed to write Firefox registry: ${err.message}`)
  }
}

function main() {
  const binaryPath = getBinaryPath()
  console.log(`Installing native messaging host for: ${binaryPath}`)

  if (process.platform === 'win32') {
    installWindows(binaryPath)
    return
  }

  // Chrome / Chromium
  const chromeDirs = getChromeManifestDirs()
  const chromeManifest = buildChromeManifest(binaryPath)
  for (const dir of chromeDirs) {
    writeManifest(dir, chromeManifest)
  }

  // Firefox
  const firefoxDirs = getFirefoxManifestDirs()
  const firefoxManifest = buildFirefoxManifest(binaryPath)
  for (const dir of firefoxDirs) {
    writeManifest(dir, firefoxManifest)
  }

  console.log('Done.')
}

main()
