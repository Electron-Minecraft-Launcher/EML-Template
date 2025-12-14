declare global {
  interface Window {
    api: {
      login: () => Promise<boolean>
      logout: () => Promise<void>
      isLoggedIn: () => Promise<boolean>
      launch: () => Promise<void>
      onProgress: (callback: (data: any) => void) => void
    }
  }
}

export async function login(): Promise<boolean> {
  return await window.api.login()
}

export async function logout(): Promise<void> {
  return await window.api.logout()
}

export async function isLoggedIn(): Promise<boolean> {
  return await window.api.isLoggedIn()
}

export async function launchGame(): Promise<void> {
  return await window.api.launch()
}

export function onProgress(callback: (data: any) => void) {
  window.api.onProgress(callback)
}
