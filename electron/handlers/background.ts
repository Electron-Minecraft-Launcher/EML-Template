import { ipcMain } from 'electron'
import { Background } from 'eml-lib'

export function registerBackgroundHandlers() {
  ipcMain.handle('background:get', async () => {
    const background = new Background('http://localhost:5173')

    try {
      const currentBackground = await getBackground()
      return currentBackground
    } catch (err) {
      console.error('Failed to fetch background:', err)
      return null
    }
  })
}

async function getBackground() {
  console.log('Fetching background from API...')
  const res = await fetch(`http://localhost:5173/api/background`)
    .then((res) => res.json() as Promise<{ background: any }>)
    .catch((err) => {
      throw err
    })
  console.log(res)

  return res ?? null
}
