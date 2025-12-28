import type Electron from 'electron'
import { ipcMain } from 'electron'
import { Bootstraps } from 'eml-lib'

let bootstraps: Bootstraps | null = null

export function registerBootstrapHandlers(mainWindow: Electron.BrowserWindow) {
  if (!bootstraps) {
    bootstraps = new Bootstraps('http://localhost:8080')

    bootstraps.on('download_progress', (data) => {
      mainWindow.webContents.send('bootstraps:download_progress', data)
    })

    bootstraps.on('download_end', (data) => {
      mainWindow.webContents.send('bootstraps:download_end', data)
    })

    bootstraps.on('bootstraps_error', (data) => {
      mainWindow.webContents.send('bootstraps:error', data)
    })
  }

  ipcMain.handle('bootstraps:check', async () => {
    try {
      return await bootstraps?.checkForUpdate()
    } catch (err) {
      console.error('Error checking for bootstraps update', err)
      return { updateAvailable: false }
    }
  })

  ipcMain.handle('bootstraps:download', async () => {
    return await bootstraps?.download()
  })

  ipcMain.handle('bootstraps:install', async () => {
    return await bootstraps?.runUpdate()
  })
}

