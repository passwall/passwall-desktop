const { contextBridge, ipcRenderer } = require('electron')

const onMenuEvent = (channel, callback) => {
  if (typeof callback !== 'function') {
    return () => {}
  }

  const listener = (_event, ...args) => callback(...args)
  ipcRenderer.on(channel, listener)

  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop')
  },
  dialog: {
    selectExportDirectory: () => ipcRenderer.invoke('dialog:selectExportDirectory'),
    selectImportFile: () => ipcRenderer.invoke('dialog:selectImportFile')
  },
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFiles: (dirPath, files) => ipcRenderer.invoke('fs:writeFiles', dirPath, files)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  api: {
    request: (opts) => ipcRenderer.invoke('api:request', opts)
  },
  keyStore: {
    isAvailable: () => ipcRenderer.invoke('keyStore:isAvailable'),
    store: (email, userKeyBase64) => ipcRenderer.invoke('keyStore:store', email, userKeyBase64),
    retrieve: (email) => ipcRenderer.invoke('keyStore:retrieve', email),
    remove: (email) => ipcRenderer.invoke('keyStore:remove', email),
    has: (email) => ipcRenderer.invoke('keyStore:has', email)
  },
  desktop: {
    isLocked: () => ipcRenderer.invoke('desktop:isLocked'),
    onLocked: (callback) => onMenuEvent('desktop:locked', callback),
    onUnlocked: (callback) => onMenuEvent('desktop:unlocked', callback)
  },
  settings: {
    getAutoLaunch: () => ipcRenderer.invoke('settings:getAutoLaunch'),
    setAutoLaunch: (enabled) => ipcRenderer.invoke('settings:setAutoLaunch', enabled),
    getUpdateSettings: () => ipcRenderer.invoke('settings:getUpdateSettings'),
    setAutoUpdateEnabled: (enabled) => ipcRenderer.invoke('settings:setAutoUpdateEnabled', enabled),
    setAutoDownloadEnabled: (enabled) =>
      ipcRenderer.invoke('settings:setAutoDownloadEnabled', enabled),
    setAutoInstallOnQuitEnabled: (enabled) =>
      ipcRenderer.invoke('settings:setAutoInstallOnQuitEnabled', enabled),
    checkForUpdatesNow: () => ipcRenderer.invoke('settings:checkForUpdatesNow'),
    installUpdateNow: () => ipcRenderer.invoke('settings:installUpdateNow')
  },
  pairing: {
    getConnectedBrowsers: () => ipcRenderer.invoke('pairing:getConnectedBrowsers'),
    removeBrowser: (origin) => ipcRenderer.invoke('pairing:removeBrowser', origin)
  },
  onMenuExport: (callback) => onMenuEvent('menu:export', callback),
  onMenuImport: (callback) => onMenuEvent('menu:import', callback)
})
