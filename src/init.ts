import { setBlockingView, setUser, setView } from './state'
import { auth, background, bootstraps, maintenance } from './ipc'
// import _mockSession from './_mock-msa'

const DEFAULT_BACKGROUND = '/src/static/images/bg.jpg'
const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve()
    img.onerror = () => resolve()
  })
}

export async function bootstrap() {
  console.log('Initializing Launcher...')

  const bgElement = document.querySelector('.app-background') as HTMLElement
  const maintenanceDates = document.getElementById('maintenance-dates')!
  const maintenanceReason = document.getElementById('maintenance-reason')!
  const progressBar = document.getElementById('update-progress-bar')
  const progressLabel = document.getElementById('update-progress-label')
  const progressPercent = document.getElementById('update-progress-percent')

  const setIndeterminate = (active: boolean) => {
    if (!progressBar || !progressPercent) return

    if (active) {
      progressBar.classList.add('indeterminate')
      progressPercent.style.display = 'none'
    } else {
      progressBar.classList.remove('indeterminate')
      progressPercent.style.display = 'block'
    }
  }

  const up = await bootstraps.check()
  const bg = await background.get()
  const mn = await maintenance.get()
  const bgUrl = bg?.file.url ?? DEFAULT_BACKGROUND

  if (up.updateAvailable) {
    setIndeterminate(false)
    progressBar!.style.width = '0%'
    progressLabel!.innerText = 'Preparing update...'
    progressPercent!.innerText = '0%'
    setBlockingView('update')
    await new Promise((r) => setTimeout(r, 500))
    bootstraps.downloadProgress((value) => {
      progressLabel!.innerText = `Downloading update...`
      const percent = ((value.downloaded.size / value.total.amount) * 100).toFixed(2)
      progressPercent!.innerText = `${percent}%`
      progressBar!.style.width = `${percent}%`
    })
    bootstraps.downloadEnd(async () => {
      setIndeterminate(true)
      progressLabel!.innerText = `Installing...`
      await bootstraps.install()
    })
    bootstraps.error((err) => {
      console.error('Error while downloading bootstraps:', err)
    })
    await bootstraps.download()
    console.log('Update installed, restarting launcher...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)

    return
  }

  if (mn) {
    const start = new Date(mn.startTime as Date)
    const end = new Date(mn.endTime as Date)
    maintenanceDates.innerText = `From ${start.toLocaleString([], dateFormatOptions)} to ${end.toLocaleString([], dateFormatOptions)}`
    maintenanceReason.innerText = mn.message ?? 'Please come back later.'
    setBlockingView('maintenance')
    return
  }
  try {
    const [_, session] = await Promise.all([
      preloadImage(bgUrl),
      auth.refresh()
      // Promise.resolve(_mockSession)
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

