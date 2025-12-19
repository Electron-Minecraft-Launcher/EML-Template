import { ipcMain, app, session } from 'electron'
import { Account, MicrosoftAuth } from 'eml-lib'
import * as fs from 'node:fs'
import * as path from 'node:path'

const sessionPath = path.join(app.getPath('userData'), 'session.json')

export function registerAuthHandlers(mainWindow: Electron.BrowserWindow) {
  const auth = new MicrosoftAuth(mainWindow)

  ipcMain.handle('auth:login', async () => {
    try {
      const account = await auth.auth()
      console.log(sessionPath)
      fs.writeFileSync(sessionPath, JSON.stringify(account))
      return { success: true, account }
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Unknown error' }
    }
  })

  ipcMain.handle('auth:refresh', async () => {
    if (!fs.existsSync(sessionPath)) {
      return { success: false }
    }

    try {
      console.log('Refreshing session from', sessionPath)
      const data = fs.readFileSync(sessionPath, 'utf-8')
      const savedSession = JSON.parse(data) as Account

      if (savedSession && savedSession.uuid) {
        const valid = await auth.validate(savedSession)
        if (valid) {
          console.log('Session is still valid.')
          return { success: true, account: savedSession }
        }
        const account = await auth.refresh(savedSession)
        fs.writeFileSync(sessionPath, JSON.stringify(account))
        return { success: true, account }
      }
      return { success: false }
    } catch (err: any) {
      console.error('Error refreshing session:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath)
    }
    return { success: true }
  })
}

