import { ipcMain } from 'electron'
import { Account, Profiles } from 'eml-lib'
import logger from 'electron-log/main'
import { ADMINTOOL_URL } from '../const'

export function registerProfilesHandlers() {
  ipcMain.handle('profiles:get', async (_event, account: Account) => {
    if (!account?.uuid) return []
    try {
      const profiles = new Profiles(ADMINTOOL_URL)
      const list = await profiles.getProfiles(account)
      const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      return sorted
    } catch (err) {
      logger.error('Failed to fetch profiles:', err)
      return []
    }
  })

  ipcMain.handle('profiles:auth', async (_event, slug: string, password: string) => {
    try {
      const profiles = new Profiles(ADMINTOOL_URL)
      const auth = await profiles.auth(slug, password)
      return { success: true, token: auth.token, slug: auth.slug }
    } catch (err: any) {
      logger.error('Failed to authenticate profile:', err)
      if (err?.code === 'TOO_MANY_REQUESTS') {
        return { success: false, error: 'Too many requests. Please try again later.' }
      } else if (err?.code === 'AUTH_ERROR') {
        return { success: false, error: err.message ?? 'Unknown error' }
      }
      return { success: false, error: 'Unknown error' }
    }
  })
}

