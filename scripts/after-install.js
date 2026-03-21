/**
 * electron-builder afterInstall hook
 *
 * Registers the native messaging host manifest so the Passwall browser
 * extension can communicate with the desktop app immediately after install.
 *
 * Called automatically by electron-builder for each target platform.
 * See: https://www.electron.build/configuration/configuration.html#afterinstall
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const HOST_NAME = 'com.passwall.desktop'
const CHROME_EXTENSION_ID = 'blaiihhmnjllkfnkmkidahhegbmlghmo'
const FIREFOX_EXTENSION_ID = 'passwall@passwall.io'

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

function writeManifest(dir, filename, content) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, filename), content, 'utf8')
    console.log(`  [native-messaging] Wrote: ${path.join(dir, filename)}`)
  } catch (err) {
    console.warn(`  [native-messaging] Failed to write ${dir}: ${err.message}`)
  }
}

exports.default = async function afterInstall(context) {
  const platform = context.packager.platform.name
  const appOutDir = context.appOutDir
  const manifestFile = `${HOST_NAME}.json`
  const home = os.homedir()

  let binaryPath

  if (platform === 'mac') {
    const appName = context.packager.appInfo.productFilename || 'Passwall'
    binaryPath = path.join('/Applications', `${appName}.app`, 'Contents', 'MacOS', appName)

    // Chrome / Chromium
    const chromeDirs = [
      path.join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts'),
      path.join(home, 'Library/Application Support/Chromium/NativeMessagingHosts')
    ]
    for (const dir of chromeDirs) {
      writeManifest(dir, manifestFile, buildChromeManifest(binaryPath))
    }

    // Firefox
    writeManifest(
      path.join(home, 'Library/Application Support/Mozilla/NativeMessagingHosts'),
      manifestFile,
      buildFirefoxManifest(binaryPath)
    )
  } else if (platform === 'windows') {
    const appName = context.packager.appInfo.productFilename || 'Passwall'
    binaryPath = path.join(appOutDir, `${appName}.exe`)

    // Write manifest next to the binary
    const manifestPath = path.join(appOutDir, manifestFile)
    fs.writeFileSync(manifestPath, buildChromeManifest(binaryPath), 'utf8')
    console.log(`  [native-messaging] Wrote: ${manifestPath}`)

    // Register in Windows registry via reg.exe
    const { execSync } = require('child_process')
    const chromeRegKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`
    try {
      execSync(`reg add "${chromeRegKey}" /ve /t REG_SZ /d "${manifestPath}" /f`, { stdio: 'pipe' })
      console.log(`  [native-messaging] Registry: ${chromeRegKey}`)
    } catch (err) {
      console.warn(`  [native-messaging] Registry write failed: ${err.message}`)
    }

    // Firefox
    const firefoxManifestPath = path.join(appOutDir, `${HOST_NAME}.firefox.json`)
    fs.writeFileSync(firefoxManifestPath, buildFirefoxManifest(binaryPath), 'utf8')
    const firefoxRegKey = `HKCU\\Software\\Mozilla\\NativeMessagingHosts\\${HOST_NAME}`
    try {
      execSync(`reg add "${firefoxRegKey}" /ve /t REG_SZ /d "${firefoxManifestPath}" /f`, {
        stdio: 'pipe'
      })
      console.log(`  [native-messaging] Registry: ${firefoxRegKey}`)
    } catch (err) {
      console.warn(`  [native-messaging] Firefox registry write failed: ${err.message}`)
    }
  } else if (platform === 'linux') {
    binaryPath = `/usr/bin/${(context.packager.appInfo.productFilename || 'passwall').toLowerCase()}`

    const chromeDirs = [
      path.join(home, '.config/google-chrome/NativeMessagingHosts'),
      path.join(home, '.config/chromium/NativeMessagingHosts')
    ]
    for (const dir of chromeDirs) {
      writeManifest(dir, manifestFile, buildChromeManifest(binaryPath))
    }

    writeManifest(
      path.join(home, '.mozilla/native-messaging-hosts'),
      manifestFile,
      buildFirefoxManifest(binaryPath)
    )
  }

  console.log('  [native-messaging] Host registration complete.')
}
