import { ipcMain } from 'electron'

let isUserLoggedIn = false

export function registerAuthHandlers() {
  ipcMain.handle('auth:login', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    isUserLoggedIn = true
    return true
  })

  ipcMain.handle('auth:logout', async () => {
    isUserLoggedIn = false
    return false
  })

  ipcMain.handle('auth:check', async () => {
    return isUserLoggedIn
  })
}
