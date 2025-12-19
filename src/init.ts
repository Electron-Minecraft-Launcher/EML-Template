import { setUser, setView } from './state'
import { auth } from './ipc'
import type { Account } from 'eml-lib'
import _mockSession from './_mock-msa'

export async function bootstrap() {
  console.log('Initializing Launcher...')
  setView('loading')
  document.body.classList.add('loaded')

  try {
    // const session = await auth.refresh()
    const session = _mockSession

    if (session.success) {
      setUser(session.account)
      setView('home')
    } else {
      setView('login')
    }
  } catch (error) {
    console.error('Failed to check auth status:', error)
    setView('login')
  }
}


