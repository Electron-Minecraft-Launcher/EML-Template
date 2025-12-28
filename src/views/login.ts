import { setUser, setView } from '../state'
import { auth } from '../ipc'
// import _mockSession from '../_mock-msa'

export function initLogin() {
  const btn = document.getElementById('btn-login-ms') as HTMLButtonElement | null
  if (!btn) return

  btn.addEventListener('click', async () => {
    const originalText = btn.innerHTML

    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting...'

    try {
      const session = await auth.login()
      // const session = _mockSession

      if (session.success) {
        setUser(session.account)
        setView('home')
      } else {
        console.error(session.error)
        alert('Login failed')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during login.')
    } finally {
      btn.disabled = false
      btn.innerHTML = originalText
    }
  })
}

