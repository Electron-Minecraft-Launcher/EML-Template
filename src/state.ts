import type { Account } from 'eml-lib'

export type ViewName = 'loading' | 'login' | 'home' | 'settings'
export type BlockingViewName = 'maintenance' | 'update'

let currentAccount: Account | null = null

export function getUser() {
  return currentAccount
}

export function setUser(account: Account) {
  currentAccount = account
  updateUserInterface()
}

export function logout() {
  currentAccount = null
  const nameEl = document.getElementById('user-name')
  if (nameEl) nameEl.innerText = ''
}

function updateUserInterface() {
  if (!currentAccount) return

  console.log('Updating UI for user:', currentAccount)

  const nameEl = document.getElementById('user-name')
  const avatarEl = document.getElementById('user-avatar') as HTMLImageElement
  const nameSettingsEl = document.getElementById('settings-user-name')
  const uuidSettingsEl = document.getElementById('settings-user-uuid')
  const typeSettingsEl = document.getElementById('settings-user-type')

  if (nameEl) nameEl.innerText = currentAccount.name
  if (avatarEl) avatarEl.src = `https://minotar.net/helm/${currentAccount.uuid ?? currentAccount.name}/100.png`
  if (nameSettingsEl) nameSettingsEl.innerText = currentAccount.name
  if (uuidSettingsEl) uuidSettingsEl.innerText = `UUID: ${currentAccount.uuid}`
  if (typeSettingsEl) typeSettingsEl.innerHTML = getAccountIcon(currentAccount.meta.type)
}

export function setView(view: ViewName) {
  const target = document.querySelector(`.view[data-view="${view}"]`) as HTMLElement
  if (!target) return console.error(`View ${view} not found`)

  const isOverlay = target.classList.contains('overlay')

  if (view === 'settings') resetSettingsTab()

  if (!isOverlay) {
    document.querySelectorAll('.view').forEach((el) => {
      if (!el.classList.contains('overlay')) {
        el.classList.remove('active')
      }
    })
  }

  target.classList.add('active')
}

export function setBlockingView(view: BlockingViewName) {
  setTimeout(() => {
    document.querySelector('div#view-loading')?.classList.add('loaded')
  }, 400)
  setTimeout(() => {
    document.querySelector(`div#view-${view}`)?.classList.add('loaded')
  }, 200)
}

export function closeOverlay(view: ViewName) {
  const target = document.querySelector(`.view[data-view="${view}"]`)
  target?.classList.remove('active')
}

function getAccountIcon(type: 'msa' | 'azuriom' | 'crack') {
  switch (type) {
    case 'msa':
      return '<i class="fa-brands fa-microsoft"></i>Microsoft account'
    case 'azuriom':
      return '<i class="fa-brands fa-globe"></i>Azuriom account'
    case 'crack':
      return '<i class="fa-solid fa-user-slash"></i>Cracked account'
    default:
      return 'Unknown account type'
  }
}

function resetSettingsTab() {
  const tabButtons = document.querySelectorAll('.nav-btn')
  const tabContents = document.querySelectorAll('.tab-content')
  tabButtons.forEach((b) => b.classList.remove('active'))
  tabContents.forEach((content) => content.classList.remove('active'))

  tabButtons[0].classList.add('active')
  tabContents[0].classList.add('active')
}
