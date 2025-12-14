import { setView, closeOverlay } from '../state'
import { logout } from '../ipc'

export function initSettings() {
  const closeBtn = document.getElementById('btn-close-settings')
  const logoutBtn = document.getElementById('btn-logout')

  // --- NAVIGATION (Fermer le modal) ---
  closeBtn?.addEventListener('click', () => {
    closeOverlay('settings')
  })

  // --- LOGOUT ---
  logoutBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout()
      closeOverlay('settings')
      setView('login')
    }
  })

  // --- TABS ---
  // (Code des tabs identique à précédemment...)
  const tabButtons = document.querySelectorAll('.nav-btn')
  const tabContents = document.querySelectorAll('.tab-content')
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      const targetTab = btn.getAttribute('data-tab')
      tabContents.forEach((content) => {
        content.id === `tab-${targetTab}` ? content.classList.add('active') : content.classList.remove('active')
      })
    })
  })

  // --- SLIDER INIT ---
  initDualSlider()
}

/**
 * Handles the Min/Max RAM slider logic
 */
function initDualSlider() {
  const minInput = document.getElementById('ram-min') as HTMLInputElement
  const maxInput = document.getElementById('ram-max') as HTMLInputElement
  const fill = document.getElementById('ram-track-fill')
  const minLabel = document.getElementById('ram-min-label')
  const maxLabel = document.getElementById('ram-max-label')

  if (!minInput || !maxInput || !fill) return

  const gap = 0.5 // Ecart minimum entre les deux poignées

  const updateSlider = (e?: Event) => {
    let minVal = parseFloat(minInput.value)
    let maxVal = parseFloat(maxInput.value)

    // Logique de collision stricte
    // Si on bouge Min et qu'il tape Max, on le bloque
    if (maxVal - minVal < gap) {
      if (e?.target === minInput) {
        minInput.value = (maxVal - gap).toString()
        minVal = parseFloat(minInput.value)
      } else {
        maxInput.value = (minVal + gap).toString()
        maxVal = parseFloat(maxInput.value)
      }
    }

    // Mise à jour des Labels
    if (minLabel) minLabel.innerText = `${minVal} GB`
    if (maxLabel) maxLabel.innerText = `${maxVal} GB`

    // --- CALIBRATION VISUELLE ---
    // Les valeurs du range sont entre 0.5 et 16.
    // L'input range renvoie une valeur absolue.
    // Pour le CSS width/left, il faut convertir en pourcentage (0-100%)

    const range = parseFloat(minInput.max) - parseFloat(minInput.min) // 16 - 0.5 = 15.5
    const minPercent = ((minVal - parseFloat(minInput.min)) / range) * 100
    const maxPercent = ((maxVal - parseFloat(maxInput.min)) / range) * 100

    fill.style.left = `${minPercent}%`
    fill.style.width = `${maxPercent - minPercent}%`
  }

  minInput.addEventListener('input', updateSlider)
  maxInput.addEventListener('input', updateSlider)

  // Appel initial
  updateSlider()
  initJavaSelector()
}

/**
 * Handles showing the custom path input for Java
 */
function initJavaSelector() {
  const select = document.getElementById('java-select') as HTMLSelectElement
  const customDiv = document.getElementById('java-custom-path')

  if (!select || !customDiv) return

  select.addEventListener('change', () => {
    if (select.value === 'custom') {
      customDiv.classList.remove('hidden')
    } else {
      customDiv.classList.add('hidden')
    }
  })
}



