import { app, BrowserWindow, Menu, dialog, ipcMain, shell, net, powerMonitor } from 'electron'
import { autoUpdater } from 'electron-updater'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import safeKeyStore from './safe-key-store.js'
import { NativeMessagingHost } from './native-messaging-host.js'

let mainWindow
const isDev = !app.isPackaged
let updateCheckTimer = null
let nativeMessagingHost = null
let autoUpdaterEventsBound = false
let appSettings = {
  autoUpdateEnabled: true,
  autoDownloadEnabled: true,
  autoInstallOnQuitEnabled: true
}
let updateState = {
  lastCheckedAt: null,
  lastResult: 'idle',
  lastError: null,
  latestVersion: null,
  downloadPercent: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  bytesPerSecond: 0,
  installReady: false
}

const NATIVE_HOST_NAME = 'com.passwall.desktop'
const CHROME_EXTENSION_ID = 'blaiihhmnjllkfnkmkidahhegbmlghmo'
const KNOWN_DEV_EXTENSION_IDS = ['cnohkljjjnoajldmkfeipegcaogcgknc']
const APP_SETTINGS_FILE_NAME = 'app-settings.json'

// If launched as a native messaging host (by browser), start in host mode
const isNativeMessagingMode = process.argv.includes('--native-messaging')
if (isNativeMessagingMode) {
  // Hide dock icon so the host subprocess is completely invisible on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide()
  }
  nativeMessagingHost = new NativeMessagingHost()
  nativeMessagingHost.start()
}

const getRendererUrl = () => {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  return `file://${path.join(__dirname, '../renderer/index.html')}`
}

async function ensureNativeHostRegistration() {
  if (process.platform === 'win32') {
    return
  }

  const envIds = String(process.env.PASSWALL_CHROME_EXTENSION_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const allowedOrigins = Array.from(
    new Set([CHROME_EXTENSION_ID, ...KNOWN_DEV_EXTENSION_IDS, ...envIds])
  ).map((id) => `chrome-extension://${id}/`)

  let hostPath
  let hostArgs = ['--native-messaging']

  if (app.isPackaged) {
    hostPath = process.execPath
  } else {
    // Dev mode: Chrome appends "chrome-extension://ID/" as an arg when launching
    // the host. Raw Electron would interpret that as the app directory and crash.
    // Solution: generate a small wrapper script that passes the project dir as
    // the first Electron arg so the origin arg is harmless.
    const projectDir = app.getAppPath()
    const wrapperDir = path.join(app.getPath('userData'), 'native-host-dev')
    const wrapperPath = path.join(wrapperDir, 'passwall-native-host.sh')
    const electronBin = process.execPath

    const wrapperContent =
      ['#!/bin/bash', `exec "${electronBin}" "${projectDir}" "--native-messaging" "$@"`].join(
        '\n'
      ) + '\n'

    try {
      await fs.mkdir(wrapperDir, { recursive: true })
      await fs.writeFile(wrapperPath, wrapperContent, { mode: 0o755 })
    } catch (_err) {
      return
    }

    hostPath = wrapperPath
    hostArgs = [] // args baked into wrapper
  }

  const manifest = JSON.stringify(
    {
      name: NATIVE_HOST_NAME,
      description: 'Passwall Desktop — secure key storage for the Passwall browser extension',
      path: hostPath,
      args: hostArgs,
      type: 'stdio',
      allowed_origins: allowedOrigins
    },
    null,
    2
  )

  const home = os.homedir()
  const chromeDirs =
    process.platform === 'darwin'
      ? [
          path.join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts'),
          path.join(home, 'Library/Application Support/Chromium/NativeMessagingHosts')
        ]
      : [
          path.join(home, '.config/google-chrome/NativeMessagingHosts'),
          path.join(home, '.config/chromium/NativeMessagingHosts')
        ]

  for (const dir of chromeDirs) {
    const manifestPath = path.join(dir, `${NATIVE_HOST_NAME}.json`)
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(manifestPath, manifest, 'utf8')
    } catch (_err) {
      // Keep registration best-effort.
    }
  }
}

function createWindow() {
  /**
   * Initial window options
   */

  mainWindow = new BrowserWindow({
    height: 600,
    width: 900,
    minWidth: 900,
    minHeight: 600,
    maxWidth: 900,
    maxHeight: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    useContentSize: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadURL(getRendererUrl())

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  createMenu()
}

const getUpdateFeedUrl = () => {
  const explicitUrl = (process.env.PASSWALL_UPDATES_URL || '').trim()
  return explicitUrl || null
}

async function ensureDevUpdateConfig(feedUrl) {
  const configPath = path.join(app.getAppPath(), 'dev-app-update.yml')
  const yaml = `provider: generic\nurl: ${feedUrl}\n`
  try {
    await fs.writeFile(configPath, yaml, 'utf8')
  } catch (error) {
    console.log('[auto-updater] failed to write dev-app-update.yml:', error?.message || error)
  }
}

function getAppSettingsPath() {
  return path.join(app.getPath('userData'), APP_SETTINGS_FILE_NAME)
}

function normalizeBooleanSetting(value, defaultValue = true) {
  return typeof value === 'boolean' ? value : defaultValue
}

async function loadAppSettings() {
  const filePath = getAppSettingsPath()
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    appSettings = {
      ...appSettings,
      ...parsed
    }
    appSettings.autoUpdateEnabled = normalizeBooleanSetting(appSettings.autoUpdateEnabled, true)
    appSettings.autoDownloadEnabled = normalizeBooleanSetting(appSettings.autoDownloadEnabled, true)
    appSettings.autoInstallOnQuitEnabled = normalizeBooleanSetting(
      appSettings.autoInstallOnQuitEnabled,
      true
    )
  } catch {
    // defaults
  }
}

async function saveAppSettings() {
  const filePath = getAppSettingsPath()
  const payload = JSON.stringify(appSettings, null, 2)
  await fs.writeFile(filePath, payload, { mode: 0o600 })
}

function bindAutoUpdaterEvents() {
  if (autoUpdaterEventsBound) return

  autoUpdaterEventsBound = true
  autoUpdater.on('error', (error) => {
    const errorMessage = error?.message || String(error)
    console.log('[auto-updater] error:', errorMessage)
    const hasDownloadedUpdate =
      updateState.lastResult === 'downloaded' &&
      Boolean(updateState.latestVersion) &&
      compareSemver(updateState.latestVersion, app.getVersion()) > 0
    if (hasDownloadedUpdate) {
      // Post-download error (e.g. Squirrel.Mac ShipIt failure on unsigned builds).
      // Keep lastResult='downloaded' so UI still shows the update exists,
      // but mark installReady=false so we use the manual DMG fallback.
      updateState.installReady = false
      console.log('[auto-updater] post-download error, installReady set to false')
      return
    }
    updateState.lastError = errorMessage
    updateState.lastResult = 'error'
    updateState.installReady = false
  })

  autoUpdater.on('update-available', (info) => {
    const incomingVersion = info?.version || null
    console.log(`[auto-updater] update available: ${incomingVersion || 'unknown'}`)
    if (!incomingVersion || compareSemver(incomingVersion, app.getVersion()) <= 0) {
      console.log('[auto-updater] ignoring: incoming version is not newer than current')
      return
    }
    const hasDownloadedUpdate =
      updateState.lastResult === 'downloaded' &&
      Boolean(updateState.latestVersion) &&
      compareSemver(updateState.latestVersion, app.getVersion()) > 0
    if (hasDownloadedUpdate && incomingVersion === updateState.latestVersion) {
      return
    }
    updateState.lastResult = 'available'
    updateState.lastError = null
    updateState.latestVersion = incomingVersion
    updateState.downloadPercent = 0
    updateState.downloadedBytes = 0
    updateState.totalBytes = 0
    updateState.bytesPerSecond = 0
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[auto-updater] update not available')
    updateState.lastResult = 'none'
    updateState.lastError = null
    updateState.latestVersion = null
    updateState.downloadPercent = 0
    updateState.downloadedBytes = 0
    updateState.totalBytes = 0
    updateState.bytesPerSecond = 0
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Number(progress?.percent || 0).toFixed(1)
    console.log(`[auto-updater] download progress: ${percent}%`)
    updateState.lastResult = 'downloading'
    updateState.downloadPercent = Number(progress?.percent || 0)
    updateState.downloadedBytes = Number(progress?.transferred || 0)
    updateState.totalBytes = Number(progress?.total || 0)
    updateState.bytesPerSecond = Number(progress?.bytesPerSecond || 0)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[auto-updater] update downloaded: ${info?.version || 'unknown'}`)
    updateState.lastResult = 'downloaded'
    updateState.lastError = null
    updateState.latestVersion = info?.version || updateState.latestVersion
    updateState.downloadPercent = 100
    updateState.bytesPerSecond = 0
    // Assume Squirrel.Mac prepared the update successfully.
    // If a ShipIt error fires afterward, the error handler sets this to false.
    updateState.installReady = true
    console.log('[auto-updater] installReady set to true')
  })
}

function normalizeVersion(version) {
  return String(version || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
}

function compareSemver(a, b) {
  const pa = normalizeVersion(a)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
  const pb = normalizeVersion(b)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
  const max = Math.max(pa.length, pb.length)
  for (let i = 0; i < max; i++) {
    const av = pa[i] ?? 0
    const bv = pb[i] ?? 0
    if (av > bv) return 1
    if (av < bv) return -1
  }
  return 0
}

function getAutoUpdateStatus() {
  const feedConfigured = Boolean(getUpdateFeedUrl())
  const devUpdaterEnabled = process.env.PASSWALL_ENABLE_DEV_UPDATER === '1'
  const supported = process.platform === 'darwin' && (!isDev || devUpdaterEnabled)
  const enabled = !!appSettings.autoUpdateEnabled
  const active = supported && enabled && feedConfigured

  let reason = null
  if (!supported) reason = 'unsupported'
  else if (!enabled) reason = 'disabled'
  else if (!feedConfigured) reason = 'missing_feed_url'

  return {
    supported,
    devUpdaterEnabled,
    enabled,
    feedConfigured,
    active,
    reason,
    feedUrl: getUpdateFeedUrl(),
    currentVersion: app.getVersion(),
    latestVersion: updateState.latestVersion,
    hasUpdate:
      Boolean(updateState.latestVersion) &&
      compareSemver(updateState.latestVersion, app.getVersion()) > 0,
    autoDownloadEnabled: !!appSettings.autoDownloadEnabled,
    autoInstallOnQuitEnabled: !!appSettings.autoInstallOnQuitEnabled,
    lastCheckedAt: updateState.lastCheckedAt,
    lastResult: updateState.lastResult,
    lastError: updateState.lastError,
    downloadPercent: updateState.downloadPercent,
    downloadedBytes: updateState.downloadedBytes,
    totalBytes: updateState.totalBytes,
    bytesPerSecond: updateState.bytesPerSecond,
    installReady: updateState.installReady
  }
}

function clearAutoUpdateSchedule() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
  }
}

async function checkForUpdatesNow(force = false) {
  const status = getAutoUpdateStatus()
  const alreadyDownloadedUpdate =
    status.lastResult === 'downloaded' &&
    Boolean(status.latestVersion) &&
    compareSemver(status.latestVersion, app.getVersion()) > 0
  if (alreadyDownloadedUpdate) {
    return {
      ok: true,
      ...status
    }
  }
  if (!force && !status.active) {
    return {
      ok: false,
      ...status
    }
  }

  updateState.lastCheckedAt = Date.now()
  updateState.lastError = null
  updateState.lastResult = 'checking'

  try {
    const result = await autoUpdater.checkForUpdates()
    const nextVersion = result?.updateInfo?.version || null
    if (nextVersion && compareSemver(nextVersion, app.getVersion()) > 0) {
      updateState.latestVersion = nextVersion
      updateState.lastResult = 'available'
    } else {
      updateState.latestVersion = null
      updateState.lastResult = 'none'
    }
    return {
      ok: true,
      ...getAutoUpdateStatus()
    }
  } catch (error) {
    console.log('[auto-updater] check failed:', error?.message || error)
    updateState.lastError = error?.message || String(error)
    updateState.lastResult = 'error'
    return {
      ok: false,
      ...getAutoUpdateStatus()
    }
  }
}

async function setupAutoUpdates() {
  clearAutoUpdateSchedule()

  const devUpdaterEnabled = process.env.PASSWALL_ENABLE_DEV_UPDATER === '1'
  autoUpdater.forceDevUpdateConfig = devUpdaterEnabled
  autoUpdater.autoDownload = !!appSettings.autoDownloadEnabled
  autoUpdater.autoInstallOnAppQuit = !!appSettings.autoInstallOnQuitEnabled
  bindAutoUpdaterEvents()

  const status = getAutoUpdateStatus()
  if (!status.active) {
    if (!status.feedConfigured) {
      console.log('[auto-updater] PASSWALL_UPDATES_URL is missing. Auto-update is disabled.')
    }
    return
  }

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: getUpdateFeedUrl()
  })
  if (isDev && devUpdaterEnabled) {
    await ensureDevUpdateConfig(getUpdateFeedUrl())
  }

  setTimeout(() => {
    checkForUpdatesNow().catch(() => {})
  }, 15000)
  updateCheckTimer = setInterval(
    () => {
      checkForUpdatesNow().catch(() => {})
    },
    6 * 60 * 60 * 1000
  )
}

app.on('ready', async () => {
  if (isNativeMessagingMode) return

  await loadAppSettings()
  ensureNativeHostRegistration().catch(() => {})
  createWindow()
  await setupAutoUpdates()
})

app.on('window-all-closed', () => {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (isNativeMessagingMode) return
  if (mainWindow === null) {
    createWindow()
  }
})

function createMenu() {
  const template = [
    {
      label: 'Application',
      submenu: [
        { label: 'About Passwall', selector: 'orderFrontStandardAboutPanel:' },
        {
          label: 'Always On Top',
          click: function () {
            mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop())
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function () {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: function () {
            mainWindow.webContents.send('menu:export')
          }
        },
        {
          label: 'Import',
          accelerator: 'CmdOrCtrl+I',
          click: function () {
            mainWindow.webContents.send('menu:import')
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function isSafeExternalUrl(url) {
  try {
    const parsed = new URL(String(url || ''))
    return ['https:', 'http:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window:toggleMaximize', () => {
  // App window is fixed-size by design.
  return false
})

ipcMain.handle('window:toggleAlwaysOnTop', () => {
  if (!mainWindow) {
    return false
  }

  const nextValue = !mainWindow.isAlwaysOnTop()
  mainWindow.setAlwaysOnTop(nextValue)
  return nextValue
})

ipcMain.handle('shell:openExternal', (_event, url) => {
  if (!isSafeExternalUrl(url)) {
    throw new Error('Blocked unsafe external URL')
  }
  return shell.openExternal(url)
})

ipcMain.handle('dialog:selectExportDirectory', async () => {
  if (!mainWindow) {
    return null
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Export Directory',
    properties: ['openDirectory', 'createDirectory']
  })

  if (result.canceled) {
    return null
  }

  return result.filePaths[0] || null
})

ipcMain.handle('dialog:selectImportFile', async () => {
  if (!mainWindow) {
    return null
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Import File',
    properties: ['openFile']
  })

  if (result.canceled) {
    return null
  }

  return result.filePaths[0] || null
})

ipcMain.handle('fs:readFile', async (_event, filePath) => {
  return fs.readFile(filePath, 'utf8')
})

ipcMain.handle('fs:writeFiles', async (_event, dirPath, files) => {
  await Promise.all(files.map((file) => fs.writeFile(path.join(dirPath, file.name), file.content)))
})

// ─── Safe Key Store (OS keychain via safeStorage) ───

ipcMain.handle('keyStore:isAvailable', () => {
  return safeKeyStore.isAvailable()
})

ipcMain.handle('keyStore:store', async (_event, email, userKeyBase64) => {
  await safeKeyStore.store(email, userKeyBase64)
})

ipcMain.handle('keyStore:retrieve', async (_event, email) => {
  return await safeKeyStore.retrieve(email)
})

ipcMain.handle('keyStore:remove', async (_event, email) => {
  await safeKeyStore.remove(email)
})

ipcMain.handle('keyStore:has', async (_event, email) => {
  return await safeKeyStore.has(email)
})

// ─── App Settings ───

ipcMain.handle('settings:getAutoLaunch', () => {
  const settings = app.getLoginItemSettings()
  return settings.openAtLogin
})

ipcMain.handle('settings:setAutoLaunch', (_event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    openAsHidden: true
  })
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.handle('settings:getUpdateSettings', () => {
  const status = getAutoUpdateStatus()
  return status
})

ipcMain.handle('settings:setAutoUpdateEnabled', async (_event, enabled) => {
  appSettings.autoUpdateEnabled = !!enabled
  await saveAppSettings()
  setupAutoUpdates()
  return getAutoUpdateStatus()
})

ipcMain.handle('settings:setAutoDownloadEnabled', async (_event, enabled) => {
  appSettings.autoDownloadEnabled = !!enabled
  await saveAppSettings()
  setupAutoUpdates()
  return getAutoUpdateStatus()
})

ipcMain.handle('settings:setAutoInstallOnQuitEnabled', async (_event, enabled) => {
  appSettings.autoInstallOnQuitEnabled = !!enabled
  await saveAppSettings()
  setupAutoUpdates()
  return getAutoUpdateStatus()
})

ipcMain.handle('settings:checkForUpdatesNow', async () => {
  return await checkForUpdatesNow(true)
})

ipcMain.handle('settings:installUpdateNow', async () => {
  const status = getAutoUpdateStatus()
  const isDownloaded =
    status.lastResult === 'downloaded' &&
    Boolean(status.latestVersion) &&
    compareSemver(status.latestVersion, status.currentVersion) > 0

  if (!isDownloaded) {
    return { ok: false, reason: 'update_not_ready', method: 'none', ...status }
  }

  // Path A: Squirrel.Mac successfully prepared the update → native install
  if (updateState.installReady) {
    console.log('[auto-updater] installReady=true, calling quitAndInstall')
    setImmediate(() => {
      try {
        autoUpdater.quitAndInstall(false, true)
      } catch (err) {
        console.log('[auto-updater] quitAndInstall threw:', err?.message || err)
      }
    })
    return { ok: true, method: 'native', ...status }
  }

  // Path B: Squirrel.Mac failed (unsigned/dev builds) → open DMG for manual install
  const feedUrl = getUpdateFeedUrl()
  if (feedUrl && status.latestVersion) {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
    const dmgUrl = `${feedUrl}/Passwall-${status.latestVersion}-${arch}.dmg`
    console.log('[auto-updater] installReady=false, opening DMG fallback:', dmgUrl)
    shell.openExternal(dmgUrl)
    return { ok: true, method: 'manual', downloadUrl: dmgUrl, ...status }
  }

  return { ok: false, reason: 'no_download_url', method: 'none', ...status }
})

// ─── Pairing Management (connected browsers) ───

ipcMain.handle('pairing:getConnectedBrowsers', () => {
  return getPersistentPairings().map((p) => ({
    ...p,
    connected: true
  }))
})

ipcMain.handle('pairing:removeBrowser', (_event, origin) => {
  if (nativeMessagingHost) {
    nativeMessagingHost.removeSession(origin)
  }
  removePersistentPairing(origin)
  return true
})

function getPairingFilePath() {
  return path.join(app.getPath('userData'), 'paired-browsers.json')
}

function getPersistentPairings() {
  try {
    const raw = require('fs').readFileSync(getPairingFilePath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function savePersistentPairings(pairings) {
  const filePath = getPairingFilePath()
  require('fs').writeFileSync(filePath, JSON.stringify(pairings, null, 2), { mode: 0o600 })
}

function addPersistentPairing(pairing) {
  const list = getPersistentPairings().filter((p) => p.origin !== pairing.origin)
  list.push(pairing)
  savePersistentPairings(list)
}

function removePersistentPairing(origin) {
  const list = getPersistentPairings().filter((p) => p.origin !== origin)
  savePersistentPairings(list)
}

// ─── Desktop Lock State (screen lock / idle detection) ───

let isDesktopLocked = false

ipcMain.handle('desktop:isLocked', () => isDesktopLocked)

app.whenReady().then(() => {
  powerMonitor.on('lock-screen', () => {
    isDesktopLocked = true
    if (mainWindow) {
      mainWindow.webContents.send('desktop:locked')
    }
    if (nativeMessagingHost) {
      nativeMessagingHost.notifyLocked()
    }
  })

  powerMonitor.on('unlock-screen', () => {
    isDesktopLocked = false
    if (mainWindow) {
      mainWindow.webContents.send('desktop:unlocked')
    }
    if (nativeMessagingHost) {
      nativeMessagingHost.notifyUnlocked()
    }
  })
})

// ─── API Proxy (bypasses CORS — requests go through Node.js, not Chromium) ───

ipcMain.handle('api:request', async (_event, opts) => {
  const { method, url, data, headers } = opts

  return new Promise((resolve, reject) => {
    const req = net.request({ method: method || 'GET', url })

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        req.setHeader(key, value)
      }
    }

    let responseBody = ''

    req.on('response', (response) => {
      response.on('data', (chunk) => {
        responseBody += chunk.toString()
      })

      response.on('end', () => {
        let parsed
        try {
          parsed = JSON.parse(responseBody)
        } catch {
          parsed = responseBody
        }

        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: parsed
        })
      })
    })

    req.on('error', (err) => {
      reject({ message: err.message })
    })

    if (data !== undefined && data !== null) {
      const body = typeof data === 'string' ? data : JSON.stringify(data)
      req.write(body)
    }

    req.end()
  })
})
