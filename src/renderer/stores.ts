import { writable } from 'svelte/store'
import type { Account, IAvatar, ICape, IProfile, ISkin } from 'eml-lib'

export type Page = 'loading' | 'login' | 'home'
export type Overlay = 'settings' | 'profile' | null

export const page = writable<Page>('loading')
export const overlay = writable<Overlay>(null)
export const account = writable<Account | null>(null)
export const avatar = writable<IAvatar | null>(null)
export const skins = writable<ISkin[]>([])
export const capes = writable<ICape[]>([])
export const profiles = writable<IProfile[]>([])
export const selectedProfile = writable<IProfile | null>(null)
export const requestedProfile = writable<IProfile | null>(null)
export const profileTokens = writable<Record<string, string>>({})

export type BlockingState =
  | { kind: 'none' }
  | { kind: 'maintenance'; dates: string; reason: string }
  | { kind: 'update'; label: string; percent: number | null }

export const blocking = writable<BlockingState>({ kind: 'none' })
export const launcherReady = writable(false)

export type DialogButton = { text: string; type: 'ok' | 'cancel' | 'danger' | 'other'; action?: () => unknown }
export type DialogState = { message: string; title?: string; buttons: DialogButton[]; resolve: (value: unknown) => void } | null
export const dialog = writable<DialogState>(null)

export function showDialog<T = boolean>(message: string, buttons: DialogButton[] = [
  { text: 'Cancel', type: 'cancel' },
  { text: 'OK', type: 'ok' }
], title?: string): Promise<T> {
  return new Promise((resolve) => dialog.set({ message, title, buttons, resolve: resolve as (value: unknown) => void }))
}

export async function resolveDialog(button: DialogButton) {
  const current = get(dialog)
  if (!current) return
  dialog.set(null)
  const value = button.action ? await button.action() : button.type === 'cancel' ? false : button.type === 'other' ? null : true
  current.resolve(value)
}

export function get<T>(store: import('svelte/store').Readable<T>): T {
  let value!: T
  const unsubscribe = store.subscribe((current) => (value = current))
  unsubscribe()
  return value
}
