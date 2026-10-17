import { setView, getUser } from '../state'
import { game, news, server, settings, profiles } from '../ipc'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import logger from 'electron-log/renderer'
import type { IProfile } from 'eml-lib'

marked.use({
  renderer: {
    link(link) {
      const href = link.href ?? '#'
      const titleAttr = link.title ? ` title="${link.title}"` : ''
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${link.text}</a>`
    }
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const parseNews = (rawContent: string) =>
  DOMPurify.sanitize(marked.parse(rawContent) as string, {
    ADD_ATTR: ['target']
  })

const backgroundColor = (color: string) => {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.1)`
}

export function initHome() {
  const body = document.body
  const playBtn = document.getElementById('btn-play')
  const settingsBtn = document.getElementById('btn-settings')
  const progressContainer = document.getElementById('launch-progress-container')
  const progressBar = document.getElementById('launch-progress-bar')
  const progressLabel = document.getElementById('launch-progress-label')
  const progressPercent = document.getElementById('launch-progress-percent')
  const statusDot = document.getElementById('server-status-dot')
  const statusText = document.getElementById('server-status-text')
  const playerCount = document.getElementById('player-count')
  const newsList = document.getElementById('news-list')
  const profileSelector = document.getElementById('profile-selector')
  const profileDropdown = document.getElementById('profile-dropdown')
  const currentProfileName = document.getElementById('current-profile-name')

  let selectedProfile: IProfile | null = null
  let allProfiles: IProfile[] = []
  let totalToDownload = 0
  let totalDownloadedByType: { type: string; size: number }[] = []

  const loadProfiles = async () => {
    allProfiles = await profiles.get()
    if (allProfiles.length > 0) {
      selectProfile(allProfiles[0])
      renderDropdown()
    }
  }

  const renderDropdown = () => {
    if (!profileDropdown) return
    profileDropdown.innerHTML = allProfiles
      .map(
        (p) => `
      <div class="profile-option ${selectedProfile?.id === p.id ? 'active' : ''}" data-id="${p.id}">
        ${p.visibility === 'PROTECTED' ? '<i class="fa-fw fa-solid fa-lock"></i>&nbsp;&nbsp;' : ''}
        ${p.name}
      </div>
    `
      )
      .join('')

    profileDropdown.querySelectorAll('.profile-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id
        const profile = allProfiles.find((p) => p.id === id)
        if (profile?.visibility && !('createdAt' in profile)) unlockProfile(profile)
        else if (profile) selectProfile(profile)
        profileSelector?.classList.remove('open')
      })
    })
  }

  const selectProfile = (profile: any) => {
    selectedProfile = profile
    if (currentProfileName) currentProfileName.innerText = profile.name
    renderDropdown()
    updateServerStatus()
  }

  const unlockProfile = (profile: any) => {
    const profileView = document.getElementById('view-profile')
    if (!profileView) return

    const profileName = document.getElementById('profile-name')
    if (profileName) profileName.innerText = profile.name

    const profileSlugInput = document.getElementById('profile-slug') as HTMLInputElement
    if (profileSlugInput) profileSlugInput.value = profile.slug

    const passwordInput = document.getElementById('profile-password') as HTMLInputElement
    if (passwordInput) {
      passwordInput.value = ''
    }

    setView('profile')
  }

  settingsBtn?.addEventListener('click', () => {
    setView('settings')
  })

  const updateServerStatus = async () => {
    if (statusDot) {
      statusDot.classList.remove('online', 'offline')
      statusDot.classList.add('pinging')
    }
    if (statusText) statusText.innerHTML = 'Pinging...'
    if (playerCount) playerCount.innerHTML = ''

    const status = selectedProfile?.ip ? await server.getStatus(selectedProfile.ip, selectedProfile.port || 25565) : null

    if (status) {
      if (statusDot) {
        statusDot.classList.remove('pinging', 'offline')
        statusDot.classList.add('online')
      }
      if (statusText) statusText.innerHTML = 'Online'

      if (playerCount) {
        playerCount.innerHTML = `<i class="fa-fw fa-solid fa-users"></i>&nbsp;&nbsp;${status.players.online.toLocaleString()} / ${status.players.max.toLocaleString()}`
      }
    } else {
      if (statusDot) {
        statusDot.classList.remove('pinging', 'online')
        statusDot.classList.add('offline')
      }
      if (statusText) statusText.innerHTML = 'Offline'
      if (playerCount) playerCount.innerHTML = ''
    }
  }

  const loadNews = async () => {
    if (!newsList) return
    newsList.innerHTML = '<div style="text-align:center; padding: 20px; color: #888;">Loading news...</div>'
    const feed = await news.getNews()

    newsList.innerHTML = ''

    if (!feed || feed.length === 0) {
      newsList.innerHTML = '<div style="text-align:center; color: #888;">No news available.</div>'
      return
    }

    feed.forEach((item: any) => {
      let tagsHTML = ''
      item.tags.forEach((tag: any) => {
        tagsHTML += `<span class="tag" style="color: ${tag.color}; background-color: ${backgroundColor(tag.color)}">${tag.name}</span>`
      })
      const articleHTML = `
        <article class="news-article">
          <div class="article-meta">
            <div class="author">
              <img src="https://minotar.net/helm/${item.author.username}/24" alt="Author" />
              <span>${item.author.username ?? 'Admin Team'}</span>
            </div>
            <span class="separator">•</span>
            <span class="date">${formatDate(item.createdAt)}</span>
            <span class="separator">•</span>
            <div class="tags-container">${tagsHTML}</div>
          </div>

          <h3>${item.title}</h3>
          
          ${item.image ? `<img src="${item.image}" alt="News Image" onerror="this.style.display='none'"/>` : ''}

          <div class="article-content">
            ${parseNews(item.content)}
          </div>
        </article>
      `

      newsList.insertAdjacentHTML('beforeend', articleHTML)
    })
  }

  loadProfiles()
  updateServerStatus()
  loadNews()

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

    logger.log(message)
    game.launch({ account: user, settings: config, profileSlug: selectedProfile?.slug })
  })

  profileSelector?.querySelector('.selected-profile')?.addEventListener('click', () => {
    profileSelector.classList.toggle('open')
  })

  body.addEventListener('click', (e) => {
    if (!profileSelector?.contains(e.target as Node)) {
      profileSelector?.classList.remove('open')
    }
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
    if (!totalDownloadedByType.find((t) => t.type === progress.type)) {
      totalDownloadedByType.push({ type: progress.type, size: progress.downloaded.size })
    } else {
      totalDownloadedByType[totalDownloadedByType.findIndex((t) => t.type === progress.type)].size = progress.downloaded.size
    }
    if (progressBar && progressLabel && progressPercent) {
      const downloadedSum = totalDownloadedByType.reduce((acc, curr) => acc + curr.size, 0)
      progressBar.style.width = `${Math.min((downloadedSum / totalToDownload) * 100, 100)}%`
      progressLabel.innerText = `Downloading ${progress.type === 'JAVA' ? 'Java' : 'game files'}...`
      progressPercent.innerText = `${Math.round(Math.min((downloadedSum / totalToDownload) * 100, 100))}%`
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

