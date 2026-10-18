import type { Account } from 'eml-lib'
import { auth, skin } from '../ipc'
import { account, avatar, capes, page, skins } from './stores'

export async function loadSessionAssets(user: Account) {
  await skin.reload(user)
  const [userSkins, userCapes, userAvatar] = await Promise.all([skin.getSkin(user), skin.getCape(user), skin.getAvatar(user)])
  account.set(user)
  skins.set(userSkins ?? [])
  capes.set(userCapes ?? [])
  avatar.set(userAvatar)
}

export async function loginWithMicrosoft() {
  const session = await auth.login()
  if (!session.success) throw new Error(session.error)
  await loadSessionAssets(session.account)
  page.set('home')
}
