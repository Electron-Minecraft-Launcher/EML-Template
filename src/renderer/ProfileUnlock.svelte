<script lang="ts">
  import { fade } from 'svelte/transition'
  import type { IProfile } from 'eml-lib'
  import { overlay, profileTokens, requestedProfile, selectedProfile } from './stores'
  import { profiles as profileApi } from '../ipc'

  let { profile }: { profile: IProfile } = $props()
  let password = $state('')
  let error = $state('')
  let submitting = $state(false)
  let previousSlug = $state<string | undefined>()
  $effect(() => {
    const slug = profile.slug
    if (previousSlug !== undefined && slug !== previousSlug) {
      password = ''
      error = ''
    }
    previousSlug = slug
  })

  async function unlock() {
    if (!password.trim() || submitting) return
    submitting = true
    error = ''
    try {
      const result = await profileApi.auth(profile.slug, password)
      if (!result.success) {
        error = 'Authentication failed. Please check your password and try again.'
        password = ''
        return
      }
      profileTokens.update((tokens) => ({ ...tokens, [profile.slug]: result.token }))
      selectedProfile.set(profile)
      overlay.set(null)
      requestedProfile.set(null)
    } catch {
      error = 'Could not authenticate this profile. Please try again.'
    } finally {
      submitting = false
    }
  }

  function close() {
    overlay.set(null)
    requestedProfile.set(null)
  }
</script>

<div
  id="view-profile"
  class="view overlay"
  transition:fade={{ duration: 100 }}
  role="presentation"
  onclick={(e) => e.target === e.currentTarget && close()}
>
  <div class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="unlock-profile-title">
    <button class="btn btn-icon-only btn-close-absolute" aria-label="Close" onclick={close}><i class="fa-fw fa-solid fa-xmark"></i></button>
    <div class="profile-content">
      <h2 id="unlock-profile-title">{profile.name}</h2>
      <p class="subtitle">Unlock this profile</p>
      <label for="profile-password">Password:</label>
      <input id="profile-password" type="password" bind:value={password} placeholder="abc123" onkeydown={(e) => e.key === 'Enter' && unlock()} />
      {#if error}<p class="error-message" role="alert">{error}</p>{/if}
      <button class="btn btn-secondary unlock-profile-btn-submit" disabled={submitting || !password.trim()} onclick={unlock}>
        {submitting ? 'Unlocking...' : 'Unlock'}
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  @use '../static/styles/profile.scss' as *;
</style>
