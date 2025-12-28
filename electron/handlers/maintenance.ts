import { ipcMain } from 'electron'
import { Maintenance } from 'eml-lib'
import { ADMINTOOL_URL } from '../const'

export function registerMaintenanceHandlers() {
  ipcMain.handle('maintenance:get', async () => {
    const maintenance = new Maintenance(ADMINTOOL_URL)

    try {
      const status = await maintenance.getMaintenance()
      return status?.startTime && new Date(status.startTime) <= new Date() ? status : null
    } catch (err) {
      console.error('Failed to fetch maintenance:', err)
      return null
    }
  })
}

