import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron'
import fs from 'fs/promises'
import path from 'path'

let mainWindow
const isDev = !app.isPackaged

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
    height: 560,
    width: 900,
    minWidth: 900,
    minHeight: 600,
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

app.on('ready', createWindow)

app.on('window-all-closed', () => {
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
        { label: 'About PassWall', selector: 'orderFrontStandardAboutPanel:' },
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
  if (!mainWindow) {
    return false
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
    return false
  }

  mainWindow.maximize()
  return true
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

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
