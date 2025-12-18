import { setView } from '../state'
import { game } from '../ipc'

export function initHome() {
  const playBtn = document.getElementById('btn-play')
  const settingsBtn = document.getElementById('btn-settings')
  const progressContainer = document.getElementById('progress-container')
  const progressBar = document.getElementById('progress-bar')
  const progressLabel = document.getElementById('progress-label')
  const progressPercent = document.getElementById('progress-percent')

  settingsBtn?.addEventListener('click', () => setView('settings'))

  playBtn?.addEventListener('click', async () => {
    if (playBtn) playBtn.style.display = 'none'
    if (progressContainer) progressContainer.classList.remove('hidden')

    await game.launch()
  })

  game.onProgress((data) => {
    if (progressBar && progressLabel && progressPercent) {
      progressBar.style.width = `${data.percent}%`
      progressLabel.innerText = data.status
      progressPercent.innerText = `${data.percent}%`

      if (data.percent >= 100) {
        setTimeout(() => {
          alert('Game Started!')
          if (playBtn) playBtn.style.display = 'block'
          if (progressContainer) progressContainer.classList.add('hidden')
          if (progressBar) progressBar.style.width = '0%'
          if (progressPercent) progressPercent.innerText = '0%'
        }, 1000)
      }
    }
  })
}

