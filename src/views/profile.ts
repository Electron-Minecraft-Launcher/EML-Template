import { closeOverlay } from '../state'

let tokens: Record<string, string> = {}

export function initProfile() {
  initUIListeners()
}

function initUIListeners() {
  const closeBtn = document.getElementById('btn-close-profile')
  const slugInput = document.getElementById('profile-slug') as HTMLInputElement
  const passwordInput = document.getElementById('profile-password') as HTMLInputElement

  closeBtn?.addEventListener('click', async () => {
    closeOverlay('profile')
  })

  passwordInput?.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
    }
  })
}

