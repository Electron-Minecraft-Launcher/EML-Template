import { setView } from './state'
import { isLoggedIn } from './ipc'

export async function bootstrap() {
  console.log('Initializing Launcher...')

  try {
    const logged = await isLoggedIn()

    if (logged) {
      setView('home')
    } else {
      setView('login')
    }
  } catch (error) {
    console.error('Failed to check auth status:', error)
    setView('login')
  } finally {
    document.body.classList.add('loaded')
  }
}
