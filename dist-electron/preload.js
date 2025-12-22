"use strict";
const electron = require("electron");
console.log("Preload script loaded");
electron.contextBridge.exposeInMainWorld("api", {
  auth: {
    login: () => electron.ipcRenderer.invoke("auth:login"),
    refresh: () => electron.ipcRenderer.invoke("auth:refresh"),
    logout: () => electron.ipcRenderer.invoke("auth:logout")
  },
  game: {
    launch: (payload) => {
      electron.ipcRenderer.invoke("game:launch", payload);
    },
    launchComputeDownload: (callback) => electron.ipcRenderer.on("game:launch_compute_download", (_event) => callback()),
    launchDownload: (callback) => electron.ipcRenderer.on("game:launch_download", (_event, value) => callback(value)),
    downloadProgress: (callback) => electron.ipcRenderer.on("game:download_progress", (_event, value) => callback(value)),
    downloadError: (callback) => electron.ipcRenderer.on("game:download_error", (_event, value) => callback(value)),
    downloadEnd: (callback) => electron.ipcRenderer.on("game:download_end", (_event, value) => callback(value)),
    launchInstallLoader: (callback) => electron.ipcRenderer.on("game:launch_install_loader", (_event, value) => callback(value)),
    launchExtractNatives: (callback) => electron.ipcRenderer.on("game:launch_extract_natives", (_event) => callback()),
    extractProgress: (callback) => electron.ipcRenderer.on("game:extract_progress", (_event, value) => callback(value)),
    extractEnd: (callback) => electron.ipcRenderer.on("game:extract_end", (_event, value) => callback(value)),
    launchCopyAssets: (callback) => electron.ipcRenderer.on("game:launch_copy_assets", (_event) => callback()),
    copyProgress: (callback) => electron.ipcRenderer.on("game:copy_progress", (_event, value) => callback(value)),
    copyEnd: (callback) => electron.ipcRenderer.on("game:copy_end", (_event, value) => callback(value)),
    launchPatchLoader: (callback) => electron.ipcRenderer.on("game:launch_patch_loader", (_event) => callback()),
    patchProgress: (callback) => electron.ipcRenderer.on("game:patch_progress", (_event, value) => callback(value)),
    patchError: (callback) => electron.ipcRenderer.on("game:patch_error", (_event, value) => callback(value)),
    patchEnd: (callback) => electron.ipcRenderer.on("game:patch_end", (_event, value) => callback(value)),
    launchCheckJava: (callback) => electron.ipcRenderer.on("game:launch_check_java", (_event) => callback()),
    javaInfo: (callback) => electron.ipcRenderer.on("game:java_info", (_event, value) => callback(value)),
    launchClean: (callback) => electron.ipcRenderer.on("game:launch_clean", (_event) => callback()),
    cleanProgress: (callback) => electron.ipcRenderer.on("game:clean_progress", (_event, value) => callback(value)),
    cleanEnd: (callback) => electron.ipcRenderer.on("game:clean_end", (_event, value) => callback(value)),
    launchLaunch: (callback) => electron.ipcRenderer.on("game:launch_launch", (_event, value) => callback(value)),
    launched: (callback) => electron.ipcRenderer.on("game:launched", (_event) => callback()),
    launchData: (callback) => electron.ipcRenderer.on("game:launch_data", (_event, value) => callback(value)),
    launchClose: (callback) => electron.ipcRenderer.on("game:launch_close", (_event, value) => callback(value)),
    launchDebug: (callback) => electron.ipcRenderer.on("game:launch_debug", (_event, value) => callback(value)),
    patchDebug: (callback) => electron.ipcRenderer.on("game:patch_debug", (_event, value) => callback(value))
  },
  server: {
    getStatus: (ip, port) => electron.ipcRenderer.invoke("server:status", ip, port)
  },
  news: {
    getNews: () => electron.ipcRenderer.invoke("news:get-news"),
    getCategories: () => electron.ipcRenderer.invoke("news:get-categories")
  },
  background: {
    get: () => electron.ipcRenderer.invoke("background:get")
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    set: (s) => electron.ipcRenderer.invoke("settings:set", s),
    pickJava: () => electron.ipcRenderer.invoke("settings:pick-java")
  },
  system: {
    getInfo: () => electron.ipcRenderer.invoke("system:info")
  }
});
