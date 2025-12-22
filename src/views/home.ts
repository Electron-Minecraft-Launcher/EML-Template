import { setView, getUser } from '../state'
import { game, settings } from '../ipc'

export function initHome() {
  const playBtn = document.getElementById('btn-play')
  const settingsBtn = document.getElementById('btn-settings')
  const progressContainer = document.getElementById('progress-container')
  const progressBar = document.getElementById('progress-bar')
  const progressLabel = document.getElementById('progress-label')
  const progressPercent = document.getElementById('progress-percent')
  let totalToDownload = 0
  let totalDownloadedByType: { type: string; size: number }[] = []

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

  settingsBtn?.addEventListener('click', () => {
    setView('settings')
  })

  playBtn?.addEventListener('click', async () => {
    setIndeterminate(true)
    if (playBtn) playBtn.style.display = 'none'
    if (progressContainer) progressContainer.classList.remove('hidden')
    if (progressBar) progressBar.style.width = '0%'
    if (progressPercent) progressPercent.innerText = '0%'

    const user = getUser()
    if (!user) return

    const config = await settings.get()

    const message = `
Ready to launch the game with the following settings:
      
👤 Account: ${user.name}
🧠 RAM: ${config.memory.min} - ${config.memory.max}
☕️ Java: ${config.java}
🖥️ Resolution: ${config.resolution.width}x${config.resolution.height}
🚀 Action on launch: ${config.launcherAction}
    `

    console.log(message)
    game.launch({ account: user, settings: config })
  })

  game.launchComputeDownload(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Preparing download...'
    if (progressPercent) progressPercent.innerText = ''
  })
  game.launchDownload((download) => {
    setIndeterminate(false)
    totalToDownload = download.total.size
    if (progressLabel) progressLabel.innerText = `Downloading files...`
  })
  game.downloadProgress((progress) => {
    setIndeterminate(false)
    if (!totalDownloadedByType.find((t) => t.type === progress.type)) {
      totalDownloadedByType.push({ type: progress.type, size: progress.downloaded.size })
    } else {
      totalDownloadedByType[totalDownloadedByType.findIndex((t) => t.type === progress.type)].size = progress.downloaded.size
    }
    if (progressBar && progressLabel && progressPercent) {
      const downloadedSum = totalDownloadedByType.reduce((acc, curr) => acc + curr.size, 0)
      console.log(progress.type, `=> Downloaded ${Math.round(downloadedSum / 1024)} / ${Math.round(totalToDownload / 1024)} kB`)
      progressBar.style.width = `${(downloadedSum / totalToDownload) * 100}%`
      progressLabel.innerText = `Downloading ${progress.type === 'JAVA' ? 'Java' : 'game files'}...`
      progressPercent.innerText = `${Math.round((downloadedSum / totalToDownload) * 100)}%`
    }
  })
  game.launchInstallLoader(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Extracting files...'
    if (progressPercent) progressPercent.innerText = ''
  })
  game.launchExtractNatives(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Extracting files...'
  })
  game.launchCopyAssets(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Extracting files...'
  })
  game.launchPatchLoader(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Finalizing setup...'
  })
  game.launchLaunch(() => {
    setIndeterminate(true)
    if (progressLabel) progressLabel.innerText = 'Launching game...'
  })
  game.launched(() => {
    setTimeout(() => {
      if (playBtn) playBtn.style.display = 'block'
      if (progressContainer) progressContainer.classList.add('hidden')
      if (progressBar) progressBar.style.width = '0%'
      if (progressPercent) progressPercent.innerText = ''
    }, 10000)
  })
}
