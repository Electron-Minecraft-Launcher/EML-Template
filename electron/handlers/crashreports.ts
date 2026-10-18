import { ipcMain, type BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { CrashReport } from 'eml-lib'
import type { Launcher, LauncherEvents } from 'eml-lib'
import logger from 'electron-log/main'
import { ADMINTOOL_URL } from '../const'

type CrashData = LauncherEvents['launch_crash'][0]

type PendingCrashReport = {
  launcher: Launcher
  crashData: CrashData
  sending: boolean
}

export type CrashReportIntegration = {
  instance: CrashReport
  attachLauncher: (launcher: Launcher) => void
}

export function registerCrashReportHandlers(mainWindow: BrowserWindow): CrashReportIntegration {
  const instance = new CrashReport(ADMINTOOL_URL)
  const pending = new Map<string, PendingCrashReport>()

  ipcMain.handle('crashreports:send', async (_event, id: string) => {
    const report = pending.get(id)
    if (!report) return { success: false, error: 'This crash report is no longer available.' }
    if (report.sending) return { success: false, error: 'This crash report is already being sent.' }

    report.sending = true
    try {
      await instance.send(report.launcher, report.crashData)
      pending.delete(id)
      return { success: true }
    } catch (error) {
      report.sending = false
      const message = error instanceof Error ? error.message : 'An unknown error occurred.'
      logger.error('Failed to send game crash report:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('crashreports:dismiss', (_event, id: string) => {
    pending.delete(id)
  })

  return {
    instance,
    attachLauncher(launcher) {
      launcher.on('launch_crash', (crashData) => {
        const id = randomUUID()
        pending.set(id, { launcher, crashData, sending: false })

        if (!mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          if (!mainWindow.isVisible()) mainWindow.show()
          mainWindow.focus()
          mainWindow.webContents.send('crashreports:detected', {
            id,
            exitCode: crashData.code,
            date: crashData.date,
            profile: launcher.config.profile.slug ?? 'Default profile',
            minecraftVersion: launcher.config.minecraft.version ?? 'unknown'
          })
        }
      })
    }
  }
}
