import { contextBridge, ipcRenderer } from 'electron'
import type { Account } from 'eml-lib'

console.log('Preload script loaded')

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (): Promise<{ success: true; account: Account } | { success: false; error: string }> => ipcRenderer.invoke('auth:login'),
    refresh: (): Promise<{ success: true; account: Account } | { success: false; error?: string }> => ipcRenderer.invoke('auth:refresh'),
    logout: (): Promise<{ success: boolean }> => ipcRenderer.invoke('auth:logout')
  },
  game: {
    launch: () => ipcRenderer.invoke('game:launch'),
    onProgress: (callback: any) => ipcRenderer.on('game:progress', (_event, value) => callback(value))
  }
})

