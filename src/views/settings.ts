import { setView, closeOverlay } from '../state'
import { auth } from '../ipc'
import { Dialog } from './dialog'

export function initSettings() {
  const closeBtn = document.getElementById('btn-close-settings')
  const logoutBtn = document.getElementById('btn-logout')

  closeBtn?.addEventListener('click', () => {
    closeOverlay('settings')
  })

  logoutBtn?.addEventListener('click', async () => {
    console.log('Logout button clicked')
    if (
      await Dialog.show(
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', type: 'cancel' },
          { text: 'Logout', type: 'danger' }
        ],
        'Log out'
      )
    ) {
      await auth.logout()
      closeOverlay('settings')
      setView('login')
    }
  })

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

  initDualSlider()
}

function initDualSlider() {
  const minInput = document.getElementById('ram-min') as HTMLInputElement
  const maxInput = document.getElementById('ram-max') as HTMLInputElement
  const fill = document.getElementById('ram-track-fill')
  const minLabel = document.getElementById('ram-min-label')
  const maxLabel = document.getElementById('ram-max-label')

  if (!minInput || !maxInput || !fill) return

  const gap = 0.5

  const updateSlider = (e?: Event) => {
    let minVal = parseFloat(minInput.value)
    let maxVal = parseFloat(maxInput.value)

    if (maxVal - minVal < gap) {
      if (e?.target === minInput) {
        minInput.value = (maxVal - gap).toString()
        minVal = parseFloat(minInput.value)
      } else {
        maxInput.value = (minVal + gap).toString()
        maxVal = parseFloat(maxInput.value)
      }
    }

    if (minLabel) minLabel.innerText = `${minVal} GB`
    if (maxLabel) maxLabel.innerText = `${maxVal} GB`

    const range = parseFloat(minInput.max) - parseFloat(minInput.min)
    const minPercent = ((minVal - parseFloat(minInput.min)) / range) * 100
    const maxPercent = ((maxVal - parseFloat(maxInput.min)) / range) * 100

    fill.style.left = `${minPercent}%`
    fill.style.width = `${maxPercent - minPercent}%`
  }

  minInput.addEventListener('input', updateSlider)
  maxInput.addEventListener('input', updateSlider)

  updateSlider()
  initJavaSelector()
}

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

