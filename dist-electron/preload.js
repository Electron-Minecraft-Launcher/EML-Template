"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  login: () => electron.ipcRenderer.invoke("auth:login"),
  logout: () => electron.ipcRenderer.invoke("auth:logout"),
  isLoggedIn: () => electron.ipcRenderer.invoke("auth:check"),
  launch: () => electron.ipcRenderer.invoke("game:launch"),
  onProgress: (callback) => electron.ipcRenderer.on("game:progress", (_event, value) => callback(value))
});
