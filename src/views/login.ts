import { setView } from '../state'
import { login } from '../ipc'

export function initLogin() {
  const btn = document.getElementById('btn-login-ms') as HTMLButtonElement | null
  if (!btn) return

  btn.addEventListener('click', async () => {
    const originalText = btn.innerHTML

    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting...'

    try {
      const success = await login()

      if (success) {
        setView('home')
      } else {
        alert('Login failed')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred during login.')
    } finally {
      btn.disabled = false
      btn.innerHTML = originalText
    }
  })
}
