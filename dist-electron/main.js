"use strict";
const electron = require("electron");
const path = require("node:path");
const node_url = require("node:url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
let isUserLoggedIn = false;
function registerAuthHandlers() {
  electron.ipcMain.handle("auth:login", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isUserLoggedIn = true;
    return true;
  });
  electron.ipcMain.handle("auth:logout", async () => {
    isUserLoggedIn = false;
    return false;
  });
  electron.ipcMain.handle("auth:check", async () => {
    return isUserLoggedIn;
  });
}
function registerLauncherHandlers(mainWindow2) {
  electron.ipcMain.handle("game:launch", async () => {
    console.log("Launch requested via IPC");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      mainWindow2.webContents.send("game:progress", {
        percent: progress,
        status: `Downloading assets... ${progress}%`
      });
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 300);
  });
}
const APP_TITLE = "My Server Launcher";
const BG_COLOR = "#121212";
const __filename$1 = node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
let mainWindow = null;
if (process.env.VITE_DEV_SERVER_URL) {
  electron.app.setName(APP_TITLE);
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1e3,
    minHeight: 700,
    title: APP_TITLE,
    backgroundColor: BG_COLOR,
    show: false,
    icon: path.join(__dirname$1, "../build/icon.png"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
function configureAppMenu() {
  electron.app.setAboutPanelOptions({
    applicationName: APP_TITLE,
    applicationVersion: electron.app.getVersion(),
    version: "Build 2025.1",
    copyright: "Copyright © 2025 EML",
    credits: "Developed with EML Lib & Electron",
    iconPath: path.join(__dirname$1, "../build/icon.png")
  });
  const template = [
    ...process.platform === "darwin" ? [
      {
        label: electron.app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    {
      label: "File",
      submenu: [
        { role: "close" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    }
  ];
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
electron.app.whenReady().then(() => {
  configureAppMenu();
  createWindow();
  if (mainWindow) {
    registerAuthHandlers();
    registerLauncherHandlers(mainWindow);
  }
});
electron.app.on("window-all-closed", () => {
  electron.app.quit();
});
