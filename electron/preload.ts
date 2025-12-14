import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  login: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  isLoggedIn: () => ipcRenderer.invoke('auth:check'),
  launch: () => ipcRenderer.invoke('game:launch'),
  onProgress: (callback: any) => ipcRenderer.on('game:progress', (_event, value) => callback(value))
})
