import type { Account } from 'eml-lib'

declare global {
  interface Window {
    api: {
      auth: {
        login: () => Promise<{ success: true; account: Account } | { success: false; error: string }>
        refresh: () => Promise<{ success: true; account: Account } | { success: false; error?: string }>
        logout: () => Promise<{ success: boolean }>
      }
      game: {
        launch: () => Promise<void>
        onProgress: (callback: any) => void
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

