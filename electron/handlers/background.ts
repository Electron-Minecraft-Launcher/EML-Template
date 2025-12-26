import { ipcMain } from 'electron'
import { Background } from 'eml-lib'

export function registerBackgroundHandlers() {
  ipcMain.handle('background:get', async () => {
    const background = new Background('http://localhost:8080')

    try {
      const currentBackground = await background.getBackground()
      return currentBackground
    } catch (err) {
      console.error('Failed to fetch background:', err)
      return null
    }
  })
}

