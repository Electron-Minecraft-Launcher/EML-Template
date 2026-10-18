<script lang="ts">
  import { loginWithMicrosoft } from './session'
  import { showDialog } from './stores'
  import logger from 'electron-log/renderer'
  import logo from '../static/images/logo.png'

  let connecting = $state(false)

  async function login() {
    connecting = true
    try {
      await loginWithMicrosoft()
    } catch (error) {
      logger.error('Login failed:', error)
      await showDialog(error instanceof Error ? error.message : 'An error occurred during login.', [{ text: 'OK', type: 'ok' }], 'Login failed')
    } finally {
      connecting = false
    }
  }
</script>

<div id="view-login" class="view">
  <div class="login-card">
    <img src={logo} class="logo" alt="EML logo" />
    <h1>Welcome</h1>
    <p class="subtitle">Log in to verify your access.</p>
    <button class="btn btn-microsoft" disabled={connecting} onclick={login}>
      {#if connecting}<i class="fa-solid fa-circle-notch fa-spin"></i>{:else}<i class="fa-brands fa-microsoft"></i>{/if}
      <span>{connecting ? 'Connecting...' : 'Sign in with Microsoft'}</span>
    </button>
    <div class="login-footer">
      <small>No account yet? <a href="https://microsoft.com" target="_blank" rel="noreferrer">Create one here</a></small>
    </div>
  </div>
</div>

<style lang="scss">
  @use '../static/styles/login.scss' as *;
</style>
