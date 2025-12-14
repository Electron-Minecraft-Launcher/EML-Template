export type ViewName = 'login' | 'home' | 'settings'

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
