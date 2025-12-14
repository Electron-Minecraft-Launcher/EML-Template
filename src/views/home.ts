import { setView } from '../state'
import { launchGame, onProgress } from '../ipc'

export function initHome() {
  const playBtn = document.getElementById('btn-play')
  const settingsBtn = document.getElementById('btn-settings')
  const progressContainer = document.getElementById('progress-container')
  const progressBar = document.getElementById('progress-bar')
  const progressLabel = document.getElementById('progress-label')

  settingsBtn?.addEventListener('click', () => setView('settings'))

  playBtn?.addEventListener('click', async () => {
    if (playBtn) playBtn.style.display = 'none'
    if (progressContainer) progressContainer.classList.remove('hidden')

    await launchGame()
  })

  onProgress((data) => {
    if (progressBar && progressLabel) {
      progressBar.style.width = `${data.percent}%`
      progressLabel.innerText = data.status

      if (data.percent >= 100) {
        setTimeout(() => {
          alert('Game Started!')
          if (playBtn) playBtn.style.display = 'block'
          if (progressContainer) progressContainer.classList.add('hidden')
          if (progressBar) progressBar.style.width = '0%'
        }, 1000)
      }
    }
  })
}

