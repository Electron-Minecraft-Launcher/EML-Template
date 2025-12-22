import { ipcMain } from 'electron'
import { IMaintenance, Maintenance } from 'eml-lib'

export function registerMaintenanceHandlers() {
  ipcMain.handle('maintenance:get', async () => {
    const maintenance = new Maintenance('http://localhost:5173')

    try {
      const status = await getMaintenance()
      console.log('Fetched maintenance status:', status)
      return status?.startTime && new Date(status.startTime) <= new Date() ? status : null
    } catch (err) {
      console.error('Failed to fetch maintenance:', err)
      return null
    }
  })
}

async function getMaintenance() {
  let res = await fetch(`http://localhost:5173/api/maintenance`, { method: 'GET' })
    .then((res) => res.json())
    .catch((err) => {
      throw err
    })

  if (res.startTime) return res as IMaintenance
  else return null
}
