import { setUser, setView } from './state'
import { auth, background, maintenance } from './ipc'
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
  const maintenanceDates = document.getElementById('maintenance-dates') as HTMLElement
  const maintenanceReason = document.getElementById('maintenance-reason') as HTMLElement

  const bg = await background.get()
  const mn = await maintenance.get()
  const bgUrl = bg?.file.url ?? DEFAULT_BACKGROUND
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  console.log('maintenance status:', mn)
  if (mn) {
    const start = new Date(mn.startTime as Date)
    const end = new Date(mn.endTime as Date)
    // to locale string but without seconds
    maintenanceDates.innerText = `From ${start.toLocaleString([], dateFormatOptions)} to ${end.toLocaleString([], dateFormatOptions)}`
    maintenanceReason.innerText = mn.message ?? 'Please come back later.'
    await new Promise((resolve) => setTimeout(resolve, 400))
    document.querySelector('div#view-loading')?.classList.add('loaded')
    await new Promise((resolve) => setTimeout(resolve, 200))
    document.querySelector('div#view-maintenance')?.classList.add('loaded')
    return
  }
  try {
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
    document.querySelector('div#view-loading')?.classList.add('loaded')
    await new Promise((resolve) => setTimeout(resolve, 200))
    document.body.classList.add('loaded')
  }
}
