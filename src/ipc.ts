import type { IGameSettings, ISystemInfo } from '../electron/handlers/settings'
import type { IAuthResponse } from '../electron/handlers/auth'

declare global {
  interface Window {
    api: {
      auth: {
        login: () => Promise<IAuthResponse>
        refresh: () => Promise<IAuthResponse>
        logout: () => Promise<{ success: boolean }>
      }
      game: {
        launch: () => Promise<void>
        onProgress: (callback: any) => void
      }
      settings: {
        get: () => Promise<IGameSettings>
        set: (s: IGameSettings) => Promise<boolean>
        pickJava: () => Promise<string | null>
      }
      system: {
        getInfo: () => Promise<ISystemInfo>
      }
    }
  }
}

export const auth = {
  login: async () => {
    return await window.api.auth.login()
  },
  logout: async () => {
    return await window.api.auth.logout()
  },
  refresh: async () => {
    return await window.api.auth.refresh()
  }
}

export const game = {
  launch: async () => {
    return await window.api.game.launch()
  },
  onProgress: (callback: (data: any) => void) => {
    window.api.game.onProgress(callback)
  }
}

export const settings = {
  get: () => window.api.settings.get(),
  set: (s: IGameSettings) => window.api.settings.set(s),
  pickJava: () => window.api.settings.pickJava()
}

export const system = {
  getInfo: () => window.api.system.getInfo()
}
