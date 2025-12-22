import { setUser, setView } from './state'
import { auth, background } from './ipc'
import type { Account } from 'eml-lib'
import _mockSession from './_mock-msa'

const DEFAULT_BACKGROUND = '/src/static/images/bg.jpg'

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve()
    img.onerror = () => {
      console.warn(`Impossible de charger le background: ${url}`)
      resolve()
    }
  })
}

export async function bootstrap() {
  console.log('Initializing Launcher...')

  const bgElement = document.querySelector('.app-background') as HTMLElement

  try {
    const bg = await background.get()
    const bgUrl = bg?.file.url ?? DEFAULT_BACKGROUND
    const [_, session] = await Promise.all([
      preloadImage(bgUrl),
      // auth.refresh()
      Promise.resolve(_mockSession)
    ])

    if (bgElement) bgElement.style.backgroundImage = `url('${bgUrl}')`

    if (session.success) {
      setUser(session.account)
      setView('home')
    } else {
      setView('login')
    }
  } catch (err) {
    console.error('Error while itializing launcher:', err)
    if (bgElement) bgElement.style.backgroundImage = `url('${DEFAULT_BACKGROUND}')`
    setView('login')
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 400))
    document.querySelector('div.loading')?.classList.add('loaded')
    await new Promise((resolve) => setTimeout(resolve, 200))
    document.body.classList.add('loaded')
  }
}
