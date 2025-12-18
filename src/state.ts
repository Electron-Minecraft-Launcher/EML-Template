import type { Account } from 'eml-lib'

export type ViewName = 'loading' | 'login' | 'home' | 'settings'

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
  if (typeSettingsEl) {
    // const typeIcon = currentAccount.type === 'microsoft' ? '<i class="fa-brands fa-microsoft"></i>' : '<i class="fa-brands fa-mojang"></i>'
    // const typeText = currentAccount.type === 'microsoft' ? 'Microsoft Account' : 'Mojang Account'
    // typeSettingsEl.innerHTML = `${typeIcon}&nbsp;&nbsp;${typeText}`
  }
}

export function setView(view: ViewName) {
  const target = document.querySelector(`.view[data-view="${view}"]`) as HTMLElement
  if (!target) return console.error(`View ${view} not found`)

  const isOverlay = target.classList.contains('overlay')

  if (!isOverlay) {
    document.querySelectorAll('.view').forEach((el) => {
      if (!el.classList.contains('overlay')) {
        el.classList.remove('active')
      }
    })
  }

  target.classList.add('active')
}

export function closeOverlay(view: ViewName) {
  const target = document.querySelector(`.view[data-view="${view}"]`)
  target?.classList.remove('active')
}

