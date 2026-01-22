var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main/index.js
var import_electron = require("electron");
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var mainWindow;
var isDev = !import_electron.app.isPackaged;
var getRendererUrl = () => {
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  return `file://${import_path.default.join(__dirname, "../renderer/index.html")}`;
};
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    height: 560,
    width: 900,
    minWidth: 900,
    minHeight: 600,
    useContentSize: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: import_path.default.join(__dirname, "preload.js")
    }
  });
  mainWindow.loadURL(getRendererUrl());
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  createMenu();
}
import_electron.app.on("ready", createWindow);
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
function createMenu() {
  const template = [
    {
      label: "Application",
      submenu: [
        { label: "About PassWall", selector: "orderFrontStandardAboutPanel:" },
        {
          label: "Always On Top",
          click: function() {
            mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
          }
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            import_electron.app.quit();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    },
    {
      label: "File",
      submenu: [
        {
          label: "Export",
          accelerator: "CmdOrCtrl+E",
          click: function() {
            mainWindow.webContents.send("menu:export");
          }
        },
        {
          label: "Import",
          accelerator: "CmdOrCtrl+I",
          click: function() {
            mainWindow.webContents.send("menu:import");
          }
        }
      ]
    }
  ];
  import_electron.Menu.setApplicationMenu(import_electron.Menu.buildFromTemplate(template));
}
import_electron.ipcMain.handle("app:quit", () => {
  import_electron.app.quit();
});
import_electron.ipcMain.handle("app:getVersion", () => {
  return import_electron.app.getVersion();
});
import_electron.ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
import_electron.ipcMain.handle("window:toggleMaximize", () => {
  if (!mainWindow) {
    return false;
  }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  }
  mainWindow.maximize();
  return true;
});
import_electron.ipcMain.handle("window:toggleAlwaysOnTop", () => {
  if (!mainWindow) {
    return false;
  }
  const nextValue = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(nextValue);
  return nextValue;
});
import_electron.ipcMain.handle("shell:openExternal", (_event, url) => {
  return import_electron.shell.openExternal(url);
});
import_electron.ipcMain.handle("dialog:selectExportDirectory", async () => {
  if (!mainWindow) {
    return null;
  }
  const result = await import_electron.dialog.showOpenDialog(mainWindow, {
    title: "Select Export Directory",
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0] || null;
});
import_electron.ipcMain.handle("dialog:selectImportFile", async () => {
  if (!mainWindow) {
    return null;
  }
  const result = await import_electron.dialog.showOpenDialog(mainWindow, {
    title: "Select Import File",
    properties: ["openFile"]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0] || null;
});
import_electron.ipcMain.handle("fs:readFile", async (_event, filePath) => {
  return import_promises.default.readFile(filePath, "utf8");
});
import_electron.ipcMain.handle("fs:writeFiles", async (_event, dirPath, files) => {
  await Promise.all(files.map((file) => import_promises.default.writeFile(import_path.default.join(dirPath, file.name), file.content)));
});
//# sourceMappingURL=index.js.map
