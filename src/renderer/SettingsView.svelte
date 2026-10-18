<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { fade } from 'svelte/transition'
  import type { SkinViewer as SkinViewerType } from 'skinview3d'
  import { auth, settings as settingsApi, skin as skinApi, system } from '../ipc'
  import type { IGameSettings } from '../../electron/handlers/settings'
  import { account, avatar, capes, overlay, page, profileTokens, profiles, selectedProfile, showDialog, skins } from './stores'
  import type { ICape, ISkin } from 'eml-lib'

  type Resolution = { label: string; value: string; width: number; height: number }
  const resolutions: Resolution[] = [
    { label: 'Auto (default)', value: '854x480', width: 854, height: 480 },
    { label: 'Fullscreen', value: 'fullscreen', width: 854, height: 480 },
    { label: '2560x1440 (1440p)', value: '2560x1440', width: 2560, height: 1440 },
    { label: '1920x1080 (1080p)', value: '1920x1080', width: 1920, height: 1080 },
    { label: '1600x900', value: '1600x900', width: 1600, height: 900 },
    { label: '1366x768', value: '1366x768', width: 1366, height: 768 },
    { label: '1280x1024', value: '1280x1024', width: 1280, height: 1024 },
    { label: '1280x720 (720p)', value: '1280x720', width: 1280, height: 720 },
    { label: '1024x768', value: '1024x768', width: 1024, height: 768 },
    { label: '800x600', value: '800x600', width: 800, height: 600 }
  ]
  const defaultSkin: ISkin = {
    id: 'steve',
    url: 'https://textures.minecraft.net/texture/d5c4ee5ce20aed9e33e866c66caa37178606234b3721084bf01d13320fb2eb3f',
    variant: 'classic',
    state: 'active'
  } as ISkin

  let tab = $state<'game' | 'skin' | 'account'>('game')
  let settings = $state<IGameSettings | null>(null)
  let version = $state('')
  let maxMemory = $state(16)
  let minMemory = $state(2)
  let maxAllocated = $state(8)
  let resolution = $state('854x480')
  let java = $state('bundled')
  let launcherAction = $state<IGameSettings['launcherAction']>('close')
  let availableResolutions = $state<Resolution[]>([])
  let canvas = $state<HTMLCanvasElement | undefined>()
  let skinViewer = $state<SkinViewerType | undefined>()
  let thumbnails = $state<Record<string, string>>({})
  let capeThumbnails = $state<Record<string, string>>({})
  let skinSourceType = $state<'file' | 'url'>('file')
  let skinUrl = $state('')
  let skinFile = $state<File | null>(null)
  let skinVariant = $state<'classic' | 'slim'>('classic')
  let skinFileInput = $state<HTMLInputElement | undefined>()
  let settingsContent = $state<HTMLElement | undefined>()
  let saving = $state(false)

  let minPercent = $derived(((minMemory - 0.5) / (maxMemory - 0.5)) * 100)
  let maxPercent = $derived(((maxAllocated - 0.5) / (maxMemory - 0.5)) * 100)
  let activeSkin = $derived($skins.find((item) => item.state === 'active') ?? defaultSkin)
  let activeCape = $derived($capes.find((item) => item.state === 'active'))
  let canAddSkin = $derived(skinSourceType === 'url' ? !!skinUrl.trim() : !!skinFile)
  let accountType = $derived($account?.meta.type ?? 'unknown')

  $effect(() => {
    if ($overlay === 'settings') tab = 'game'
  })

  onMount(() => {
    void loadSettings()
    return () => skinViewer?.dispose()
  })

  async function loadSettings() {
    try {
      const [info, saved] = await Promise.all([system.getInfo(), settingsApi.get()])
      settings = saved
      version = `EML Template v${info.version}`
      maxMemory = Math.max(1, Math.min(info.totalMem, 16))
      minMemory = Math.min(saved.memory.min, maxMemory - 0.5)
      maxAllocated = Math.min(Math.max(saved.memory.max, minMemory + 0.5), maxMemory)
      availableResolutions = [
        resolutions[0],
        ...resolutions.slice(1).filter((item) => item.width <= info.resolution.width && item.height <= info.resolution.height)
      ]
      resolution = saved.resolution.fullscreen ? 'fullscreen' : `${saved.resolution.width}x${saved.resolution.height}`
      if (!availableResolutions.some((item) => item.value === resolution)) resolution = availableResolutions[0]?.value ?? '854x480'
      java = saved.java === 'bundled' ? 'bundled' : 'system'
      launcherAction = saved.launcherAction
    } catch (error) {
      console.error('Could not load settings:', error)
      await showDialog('Could not load launcher settings.', [{ text: 'OK', type: 'ok' }])
    }
  }

  $effect(() => {
    if (tab === 'skin' && canvas && !skinViewer) void initializeSkinViewer()
  })
  $effect(() => {
    if (tab !== 'skin' && skinViewer) {
      skinViewer.dispose()
      skinViewer = undefined
    }
  })

  async function initializeSkinViewer() {
    await tick()
    const targetCanvas = canvas
    if (!targetCanvas || skinViewer) return
    const { SkinViewer, WalkingAnimation } = await import('skinview3d')
    skinViewer = new SkinViewer({ canvas: targetCanvas, width: 530, height: 250, preserveDrawingBuffer: true })
    skinViewer.animation = new WalkingAnimation()
    skinViewer.animation.speed = 0.3
    skinViewer.camera.position.set(-20, -2, 35)
    skinViewer.controls.enableZoom = false
    skinViewer.controls.enablePan = false
    skinViewer.controls.rotateSpeed = 0.3
  }

  $effect(() => {
    const viewer = skinViewer
    if (viewer && activeSkin) {
      void viewer
        .loadSkin(activeSkin.url, { model: activeSkin.variant === 'slim' ? 'slim' : 'default' })
        .catch((error) => console.warn('Could not load skin preview:', error))
      if (activeCape) void viewer.loadCape(activeCape.url).catch((error) => console.warn('Could not load cape preview:', error))
      else viewer.resetCape()
    }
  })

  $effect(() => {
    if (tab === 'skin' && $skins.length) void makeSkinThumbnails($skins)
  })
  $effect(() => {
    if (tab === 'skin' && $capes.length) void makeCapeThumbnails($capes)
  })

  function normalizeMemory(which: 'min' | 'max') {
    if (which === 'min') {
      minMemory = Math.min(minMemory, maxAllocated - 0.5)
      minMemory = Math.max(0.5, minMemory)
    } else {
      maxAllocated = Math.max(maxAllocated, minMemory + 0.5)
      maxAllocated = Math.min(maxMemory, maxAllocated)
    }
  }

  async function makeSkinThumbnails(items: ISkin[]) {
    const { SkinViewer, WalkingAnimation } = await import('skinview3d')
    const viewer = new SkinViewer({ canvas: document.createElement('canvas'), width: 159, height: 180 })
    viewer.animation = new WalkingAnimation()
    viewer.animation.progress = 0.5
    viewer.animation.speed = 0
    viewer.zoom = 0.8
    viewer.camera.position.set(-20, -2, 35)
    viewer.controls.enabled = false
    const next: Record<string, string> = {}
    for (const item of items) {
      try {
        await viewer.loadSkin(item.url, { model: item.variant === 'slim' ? 'slim' : 'default' })
        viewer.render()
        next[`${item.url}-${item.variant}`] = viewer.canvas.toDataURL()
      } catch (error) {
        console.warn('Could not render skin thumbnail:', error)
      }
    }
    viewer.dispose()
    thumbnails = next
  }

  async function makeCapeThumbnails(items: ICape[]) {
    const next: Record<string, string> = {}
    for (const item of items) {
      try {
        const image = await createImageBitmap(await (await fetch(item.url)).blob())
        const output = document.createElement('canvas')
        output.width = 100
        output.height = 160
        const context = output.getContext('2d')!
        context.imageSmoothingEnabled = false
        context.drawImage(image, 1, 1, 10, 16, 0, 0, 100, 160)
        next[item.url] = output.toDataURL()
        image.close()
      } catch (error) {
        console.warn('Could not render cape thumbnail:', error)
      }
    }
    capeThumbnails = next
  }

  async function saveSettings() {
    if (!settings) {
      overlay.set(null)
      return
    }
    const picked = availableResolutions.find((item) => item.value === resolution)
    const next: IGameSettings = {
      ...settings,
      memory: { min: minMemory, max: maxAllocated },
      resolution: { width: picked?.width ?? 854, height: picked?.height ?? 480, fullscreen: resolution === 'fullscreen' },
      java: java === 'bundled' ? 'bundled' : 'system',
      launcherAction
    }
    saving = true
    try {
      const ok = await settingsApi.set(next)
      if (!ok) throw new Error('The settings could not be saved.')
      settings = next
      overlay.set(null)
    } catch (error) {
      await showDialog(error instanceof Error ? error.message : 'Could not save settings.', [{ text: 'OK', type: 'ok' }])
    } finally {
      saving = false
    }
  }

  async function logout() {
    const confirmed = await showDialog('Log out?', [
      { text: 'Cancel', type: 'cancel' },
      { text: 'Logout', type: 'danger' }
    ])
    if (!confirmed) return
    await auth.logout()
    account.set(null)
    avatar.set(null)
    skins.set([])
    capes.set([])
    profileTokens.set({})
    selectedProfile.set(null)
    profiles.set([])
    overlay.set(null)
    page.set('login')
  }

  async function addSkin() {
    if (!canAddSkin) return
    try {
      const source = skinSourceType === 'url' ? skinUrl.trim() : await skinFile!.arrayBuffer()
      const updated = await skinApi.updateSkin(source, skinVariant)
      if (!updated) throw new Error('Failed to add skin. Check the URL or file and try again.')
      skins.set(updated)
      skinUrl = ''
      skinFile = null
      if (skinFileInput) skinFileInput.value = ''
      settingsContent?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      await showDialog(error instanceof Error ? error.message : 'An error occurred while adding the skin.', [{ text: 'Close', type: 'ok' }])
    }
  }

  async function selectSkin(item: ISkin) {
    if (item.state === 'active') return
    try {
      const updated = await skinApi.updateSkin(item.url, item.variant as 'classic' | 'slim')
      if (updated) skins.set(updated)
    } catch {
      await showDialog('An error occurred while changing the skin. Please try again.', [{ text: 'Close', type: 'ok' }])
    }
  }

  async function deleteSkin(item: ISkin, e: MouseEvent) {
    e.stopPropagation()
    try {
      const updated = await skinApi.deleteSkin(item.id)
      if (updated) skins.set(updated)
    } catch {
      await showDialog('An error occurred while deleting the skin.', [{ text: 'OK', type: 'ok' }])
    }
  }

  async function selectCape(id?: string) {
    try {
      const updated = id ? await skinApi.switchCape(id) : await skinApi.hideCape()
      if (updated) capes.set(updated)
    } catch {
      await showDialog('An error occurred while changing the cape.', [{ text: 'Close', type: 'ok' }])
    }
  }

  function accountTypeLabel(type: string) {
    return (
      ({ msa: 'Microsoft account', yggdrasil: 'Yggdrasil account', azuriom: 'Azuriom account', crack: 'Cracked account' } as Record<string, string>)[
        type
      ] ?? 'Unknown account type'
    )
  }

  function accountTypeIcon(type: string) {
    return (
      (
        { msa: 'fa-brands fa-microsoft', yggdrasil: 'fa-solid fa-user', azuriom: 'fa-solid fa-globe', crack: 'fa-solid fa-user-slash' } as Record<
          string,
          string
        >
      )[type] ?? 'fa-solid fa-user'
    )
  }
</script>

<div id="view-settings" class="view overlay" transition:fade={{ duration: 100 }}>
  <div class="settings-modal">
    <button class="btn btn-icon-only btn-close-absolute" aria-label="Close settings" disabled={saving} onclick={saveSettings}
      ><i class="fa-fw fa-solid fa-xmark"></i></button
    >
    <aside class="settings-sidebar">
      <h2>Settings</h2>
      <nav>
        <button class="btn nav-btn" class:active={tab === 'game'} onclick={() => (tab = 'game')}
          ><i class="fa-fw fa-solid fa-cubes"></i><span>Game</span></button
        >
        <button class="btn nav-btn" class:active={tab === 'skin'} onclick={() => (tab = 'skin')}
          ><i class="fa-fw fa-solid fa-shirt"></i><span>Skin</span></button
        >
        <button class="btn nav-btn" class:active={tab === 'account'} onclick={() => (tab = 'account')}
          ><i class="fa-fw fa-solid fa-user"></i><span>Account</span></button
        >
      </nav>
      <p id="version">{version}</p>
    </aside>
    <main class="settings-content" id="settings-content" bind:this={settingsContent}>
      {#if tab === 'game'}
        <section id="tab-game" class="tab-content">
          <h3>Minecraft configuration</h3>
          <div class="setting-group">
            <label for="ram-min"><i class="fa-fw fa-solid fa-memory"></i>&nbsp;&nbsp;Allocated RAM</label>
            <div class="dual-slider-container">
              <div class="slider-track"></div>
              <div class="slider-fill" style:left="{minPercent}%" style:width="{maxPercent - minPercent}%"></div>
              <input
                id="ram-min"
                type="range"
                min="0.5"
                max={maxMemory}
                step="0.5"
                bind:value={minMemory}
                oninput={() => normalizeMemory('min')}
                aria-label="Minimum RAM"
              />
              <input
                type="range"
                min="0.5"
                max={maxMemory}
                step="0.5"
                bind:value={maxAllocated}
                oninput={() => normalizeMemory('max')}
                aria-label="Maximum RAM"
              />
            </div>
            <div class="ram-labels"><span>{minMemory} GB</span><span>{maxAllocated} GB</span></div>
          </div>
          <div class="setting-group">
            <label for="resolution-select"><i class="fa-fw fa-solid fa-display"></i>&nbsp;&nbsp;Window size</label>
            <select id="resolution-select" bind:value={resolution}
              >{#each availableResolutions as item}<option value={item.value}>{item.label}</option>{/each}</select
            >
          </div>
          <div class="setting-group">
            <label for="launcher-action-select"><i class="fa-solid fa-power-off"></i>&nbsp;&nbsp;Action after launch</label>
            <div class="select-wrapper">
              <select id="launcher-action-select" bind:value={launcherAction}
                ><option value="close">Close launcher</option><option value="keep">Keep launcher open</option><option value="hide"
                  >Hide launcher (minimize)</option
                ></select
              >
            </div>
          </div>
          <div class="setting-group">
            <label for="java-select"><i class="fa-brands fa-java"></i>&nbsp;&nbsp;Java version</label>
            <div class="java-selector">
              <select id="java-select" bind:value={java}
                ><option value="bundled">Use bundled Java (recommended)</option><option value="system">Use system Java (PATH)</option></select
              >
            </div>
          </div>
        </section>
      {:else if tab === 'skin'}
        <section id="tab-skin" class="tab-content skin-management">
          <h3>Skin management</h3>
          <canvas bind:this={canvas} id="skin-container" aria-label="3D skin preview"></canvas>
          <div class="setting-group">
            <p class="setting-group-label">Skins</p>
            <div id="skin-gallery" class="skin-gallery">
              {#each $skins as item (item.id)}
                <div
                  class="skin-preview"
                  class:active={item.state === 'active'}
                  role="button"
                  tabindex="0"
                  aria-label="Use skin"
                  onclick={() => selectSkin(item)}
                  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSkin(item)}
                >
                  {#if thumbnails[`${item.url}-${item.variant}`]}<img
                      src={thumbnails[`${item.url}-${item.variant}`]}
                      alt="Skin preview"
                    />{:else}<span class="spinner">Loading…</span>{/if}
                  {#if item.state === 'inactive' && item.id !== 'steve' && item.id !== 'alex'}<button
                      class="btn-delete-skin btn btn-secondary"
                      aria-label="Delete skin"
                      onclick={(e) => deleteSkin(item, e)}><i class="fa-solid fa-times"></i></button
                    >{/if}
                </div>
              {/each}
            </div>
            <div id="add-skin" class="add-skin">
              <p class="add-skin-title">Add skin</p>
              <div class="btns-add-skin">
                <button class="btn-add-skin" class:active={skinSourceType === 'file'} onclick={() => (skinSourceType = 'file')}>File</button><button
                  class="btn-add-skin"
                  class:active={skinSourceType === 'url'}
                  onclick={() => (skinSourceType = 'url')}>URL</button
                >
              </div>
              {#if skinSourceType === 'file'}
                <label for="input-add-skin-file">Skin file:</label>
                <input
                  bind:this={skinFileInput}
                  id="input-add-skin-file"
                  type="file"
                  accept=".png"
                  onchange={(e) => (skinFile = e.currentTarget.files?.[0] ?? null)}
                />
                {#if !skinFile}<button class="btn btn-choose-file btn-secondary" onclick={() => skinFileInput?.click()}>Choose file...</button>{/if}
                {#if skinFile}<div class="selected-file">
                    <span>{skinFile.name}</span><button
                      class="btn btn-secondary btn-reset"
                      aria-label="Remove selected file"
                      onclick={() => {
                        skinFile = null
                        if (skinFileInput) skinFileInput.value = ''
                      }}><i class="fa-solid fa-times"></i></button
                    >
                  </div>{/if}
              {:else}
                <label for="input-add-skin-url">Skin URL:</label><input
                  id="input-add-skin-url"
                  type="text"
                  bind:value={skinUrl}
                  placeholder="https://..."
                />
              {/if}
              <label for="variant-classic">Variant:</label>
              <div class="variant-options">
                <input id="variant-classic" type="radio" bind:group={skinVariant} value="classic" /><label for="variant-classic">Classic</label><input
                  id="variant-slim"
                  type="radio"
                  bind:group={skinVariant}
                  value="slim"
                /><label for="variant-slim">Slim</label>
              </div>
              <button class="add-skin-btn-submit btn btn-secondary" disabled={!canAddSkin} onclick={addSkin}>Add and use</button>
            </div>
          </div>
          <div class="setting-group">
            <p class="setting-group-label">Cape</p>
            <div id="cape-gallery" class="skin-gallery">
              <button type="button" class="cape-preview" class:active={!activeCape} aria-label="Hide cape" onclick={() => selectCape()}>
                <span><i class="fa-solid fa-ban"></i></span>
              </button>
              {#each $capes as item (item.id)}<button
                  class="cape-preview"
                  class:active={item.state === 'active'}
                  aria-label="Use {item.alias}"
                  onclick={() => selectCape(item.id)}
                  >{#if capeThumbnails[item.url]}<img src={capeThumbnails[item.url]} alt="" />{/if}<span>{item.alias}</span></button
                >{/each}
            </div>
          </div>
        </section>
      {:else}
        <section id="tab-account" class="tab-content">
          <h3>Account management</h3>
          <div class="account-card">
            <div class="account-header">
              <img src={$avatar?.url ?? 'https://minotar.net/avatar/steve/256.png'} alt="Account avatar" class="account-avatar" />
              <div class="account-details">
                <span class="account-name">{$account?.name}</span><span class="account-uuid">UUID: {$account?.uuid}</span><span class="account-type"
                  ><i class={accountTypeIcon(accountType)}></i>&nbsp;&nbsp;{accountTypeLabel(accountType)}</span
                >
              </div>
            </div>
            <div class="account-actions">
              <a href="https://www.xbox.com/play/user" target="_blank" rel="noreferrer" class="btn btn-secondary"
                ><i class="fa-fw fa-solid fa-external-link-alt"></i><span>Manage Xbox Account</span></a
              ><button class="btn btn-danger" onclick={logout}><i class="fa-fw fa-solid fa-right-from-bracket"></i><span>Log out</span></button>
            </div>
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>

<style lang="scss">
  @use '../static/styles/settings.scss' as *;
</style>
