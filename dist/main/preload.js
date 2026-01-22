// src/preload/index.js
var { contextBridge, ipcRenderer } = require("electron");
var onMenuEvent = (channel, callback) => {
  if (typeof callback !== "function") {
    return () => {
    };
  }
  const listener = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};
contextBridge.exposeInMainWorld("electronAPI", {
  app: {
    quit: () => ipcRenderer.invoke("app:quit"),
    getVersion: () => ipcRenderer.invoke("app:getVersion")
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
    toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggleAlwaysOnTop")
  },
  dialog: {
    selectExportDirectory: () => ipcRenderer.invoke("dialog:selectExportDirectory"),
    selectImportFile: () => ipcRenderer.invoke("dialog:selectImportFile")
  },
  fs: {
    readFile: (filePath) => ipcRenderer.invoke("fs:readFile", filePath),
    writeFiles: (dirPath, files) => ipcRenderer.invoke("fs:writeFiles", dirPath, files)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url)
  },
  onMenuExport: (callback) => onMenuEvent("menu:export", callback),
  onMenuImport: (callback) => onMenuEvent("menu:import", callback)
});
//# sourceMappingURL=preload.js.map
