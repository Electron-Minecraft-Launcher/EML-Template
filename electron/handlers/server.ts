import { ipcMain } from 'electron'
import { ServerStatus } from 'eml-lib'

export function registerServerHandlers() {
  ipcMain.handle('server:status', async (_event, ip: string, port: number = 25565) => {
    try {
      const server = new ServerStatus(ip, port, 'modern', 774)
      const status = await server.getStatus()
      return status
    } catch (err) {
      console.error('Failed to get server status:', err)
      return null
    }
  })
}
