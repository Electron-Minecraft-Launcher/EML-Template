export type ButtonType = 'ok' | 'cancel' | 'danger' | 'other'

export interface DialogButton {
  text: string
  type: ButtonType
  action?: () => any
}

class DialogSystem {
  private readonly overlay: HTMLElement
  private readonly messageEl: HTMLElement
  private readonly titleEl: HTMLElement
  private readonly buttonsEl: HTMLElement

  constructor() {
    this.overlay = document.getElementById('custom-dialog')!
    this.messageEl = document.getElementById('dialog-message')!
    this.titleEl = document.getElementById('dialog-title')!
    this.buttonsEl = document.getElementById('dialog-buttons')!
  }

  public async show<T = boolean>(message: string, buttons?: DialogButton[], title?: string): Promise<T> {
    return new Promise<T>((resolve) => {
      this.messageEl.innerText = message
      this.buttonsEl.innerHTML = ''

      if (title) {
        this.titleEl.innerText = title
        this.titleEl.classList.remove('hidden')
      } else {
        this.titleEl.classList.add('hidden')
      }

      const configButtons = buttons ?? [
        { text: 'Cancel', type: 'cancel' },
        { text: 'OK', type: 'ok' }
      ]

      configButtons.forEach((btnConfig) => {
        const btn = document.createElement('button')
        btn.innerText = btnConfig.text
        btn.className = `btn btn-${btnConfig.type === 'ok' ? 'primary' : btnConfig.type === 'danger' ? 'danger' : 'secondary'}`

        btn.onclick = async () => {
          this.close()

          if (btnConfig.action) {
            const result = await btnConfig.action()
            resolve(result !== undefined ? result : (true as any))
          } else {
            switch (btnConfig.type) {
              case 'cancel':
                resolve(false as any)
                break
              case 'ok':
              case 'danger':
                resolve(true as any)
                break
              case 'other':
                console.warn("The 'other' type button requires an action!")
                resolve(null as any)
                break
            }
          }
        }

        this.buttonsEl.appendChild(btn)
      })

      this.overlay.classList.remove('hidden')
    })
  }

  private close() {
    this.overlay.classList.add('hidden')
  }
}

export const Dialog = new DialogSystem()

