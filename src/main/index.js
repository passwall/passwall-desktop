import { app, BrowserWindow, Menu, dialog, ipcMain, shell, net } from 'electron'
import { autoUpdater } from 'electron-updater'
import fs from 'fs/promises'
import path from 'path'

let mainWindow
const isDev = !app.isPackaged
let updateCheckTimer = null

const getRendererUrl = () => {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  return `file://${path.join(__dirname, '../renderer/index.html')}`
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

const setupAutoUpdates = () => {
  if (isDev || process.platform !== 'darwin') {
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const feedUrl = getUpdateFeedUrl()
  if (!feedUrl) {
    console.log('[auto-updater] PASSWALL_UPDATES_URL is missing. Auto-update is disabled.')
    return
  }

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: feedUrl
  })

  autoUpdater.on('error', (error) => {
    console.log('[auto-updater] error:', error?.message || error)
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[auto-updater] update available: ${info?.version || 'unknown'}`)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[auto-updater] update not available')
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Number(progress?.percent || 0).toFixed(1)
    console.log(`[auto-updater] download progress: ${percent}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[auto-updater] update downloaded: ${info?.version || 'unknown'}`)
    // Install on next app quit to avoid interrupting active user sessions.
  })

  const check = async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      console.log('[auto-updater] check failed:', error?.message || error)
    }
  }

  setTimeout(check, 15000)
  updateCheckTimer = setInterval(check, 6 * 60 * 60 * 1000)
}

app.on('ready', () => {
  createWindow()
  setupAutoUpdates()
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

