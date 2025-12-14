import { ipcMain, BrowserWindow } from 'electron'

export function registerLauncherHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('game:launch', async () => {
    console.log('Launch requested via IPC')

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      mainWindow.webContents.send('game:progress', {
        percent: progress,
        status: `Downloading assets...`,
        percentComplete: progress / 100,
      })

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 200)
  })
}
