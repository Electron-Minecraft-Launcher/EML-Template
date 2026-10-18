<script lang="ts">
  import { onMount } from 'svelte'
  import DOMPurify from 'dompurify'
  import { marked } from 'marked'
  import logger from 'electron-log/renderer'
  import type { IProfile } from 'eml-lib'
  import { game, news as newsApi, profiles as profilesApi, server, settings as settingsApi } from '../ipc'
  import { account, avatar, get as getStoreValue, overlay, profileTokens, profiles, requestedProfile, selectedProfile, showDialog } from './stores'
  import goldImage from '../static/images/gold.png'
  import silverImage from '../static/images/silver.png'
  import bronzeImage from '../static/images/bronze.png'
  import boxImage from '../static/images/box.png'
  import { slide } from 'svelte/transition'

  type NewsFeedItem = {
    id?: string
    title: string
    content: string
    author: { username?: string | null }
    createdAt: Date | string
    image?: string | null
    tags?: Array<{ title?: string; name?: string; color: string }>
  }

  let newsItems = $state<NewsFeedItem[]>([])
  let newsLoading = $state(true)
  let newsError = $state(false)
  let profileMenuOpen = $state(false)
  let profileSelector = $state<HTMLDivElement | undefined>()
  let serverState = $state<'pinging' | 'online' | 'offline'>('pinging')
  let players = $state('')
  let launch = $state<{ visible: boolean; label: string; percent: number | null; indeterminate: boolean }>({
    visible: false,
    label: 'Preparing download...',
    percent: 0,
    indeterminate: true
  })
  let totalBytes = $state(0)
  let downloaded = $state<Record<string, number>>({})
  let statusRequest = 0
  let profileRequest = 0
  let selectedSlug = $derived($selectedProfile?.slug)

  marked.use({
    renderer: {
      link(link) {
        const title = link.title ? ` title="${link.title}"` : ''
        return `<a href="${link.href ?? '#'}" target="_blank" rel="noopener noreferrer"${title}>${link.text}</a>`
      }
    }
  })

  onMount(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!profileSelector?.contains(event.target as Node)) profileMenuOpen = false
    }
    window.addEventListener('click', closeMenu)
    void loadNews()

    const unsubscribe = [
      game.launchComputeDownload(() => setLaunchStep('Preparing download...')),
      game.launchDownload((download) => {
        totalBytes = download.total.size
        downloaded = {}
        launch = { visible: true, label: 'Downloading files...', percent: 0, indeterminate: false }
      }),
      game.downloadProgress((progress) => {
        downloaded[progress.type] = progress.downloaded.size
        const amount = Object.values(downloaded).reduce((sum, value) => sum + value, 0)
        const percent = totalBytes ? Math.min((amount / totalBytes) * 100, 100) : 0
        launch = { visible: true, label: `Downloading ${progress.type === 'JAVA' ? 'Java' : 'game files'}...`, percent, indeterminate: false }
      }),
      game.downloadError((error) => {
        launch = { ...launch, visible: false }
        logger.error('Game download failed:', error)
        void showDialog('A game file could not be downloaded.', [{ text: 'OK', type: 'ok' }])
      }),
      game.launchInstallLoader(() => setLaunchStep('Extracting files...')),
      game.launchExtractNatives(() => setLaunchStep('Extracting files...')),
      game.launchCopyAssets(() => setLaunchStep('Extracting files...')),
      game.launchPatchLoader(() => setLaunchStep('Finalizing setup...')),
      game.launchLaunch(() => setLaunchStep('Launching game...')),
      game.patchError((error) => {
        launch = { ...launch, visible: false }
        logger.error('Game patching failed:', error)
        void showDialog('Game setup failed. Please try again.', [{ text: 'OK', type: 'ok' }])
      }),
      game.launched(() =>
        window.setTimeout(() => {
          launch = { ...launch, visible: false }
        }, 10000)
      )
    ]
    return () => {
      window.removeEventListener('click', closeMenu)
      unsubscribe.forEach((dispose) => dispose())
    }
  })

  async function loadNews() {
    newsLoading = true
    newsError = false
    try {
      newsItems = (await newsApi.getNews()) as unknown as NewsFeedItem[]
    } catch (error) {
      logger.error('Could not load news:', error)
      newsError = true
    } finally {
      newsLoading = false
    }
  }

  async function refreshServerStatus(profile: IProfile | null) {
    const request = ++statusRequest
    serverState = 'pinging'
    players = ''
    const status = profile?.ip ? await server.getStatus(profile.ip, profile.port || 25565).catch(() => null) : null
    if (request !== statusRequest) return
    serverState = status ? 'online' : 'offline'
    if (status) players = `${status.players.online.toLocaleString()} / ${status.players.max.toLocaleString()}`
  }

  function chooseProfile(profile: IProfile) {
    if (profile.visibility === 'PROTECTED' && !$profileTokens[profile.slug]) {
      requestedProfile.set(profile)
      overlay.set('profile')
    } else {
      selectedProfile.set(profile)
    }
    profileMenuOpen = false
  }

  function renderMarkdown(content: string) {
    const parsed = marked.parse(content, { async: false, gfm: true }) as string
    return DOMPurify.sanitize(parsed, { ADD_ATTR: ['target', 'rel'] })
  }

  function formatDate(value: Date | string) {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function tagBackground(color: string) {
    if (!/^#[\da-f]{6}$/i.test(color)) return 'rgba(255,255,255,.1)'
    const r = parseInt(color.slice(1, 3), 16),
      g = parseInt(color.slice(3, 5), 16),
      b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.1)`
  }

  async function startGame() {
    if (!$account || launch.visible) return
    launch = { visible: true, label: 'Preparing download...', percent: null, indeterminate: true }
    totalBytes = 0
    downloaded = {}
    try {
      const config = await settingsApi.get()

      const message = `
Ready to launch the game with the following settings:
      
         👤 Account:  ${$account.name}
             🧠 RAM:  ${config.memory.min} - ${config.memory.max}
            ☕️ Java:  ${config.java}
      🖥️ Resolution:  ${config.resolution.width}x${config.resolution.height}
🚀 Action on launch:  ${config.launcherAction}
`

      logger.log(message)

      await game.launch({
        account: $account,
        settings: config,
        profileSlug: $selectedProfile?.slug,
        token: $selectedProfile?.slug ? $profileTokens[$selectedProfile.slug] : undefined
      })
    } catch (error) {
      launch = { ...launch, visible: false }
      logger.error('Could not launch the game:', error)
      await showDialog('Could not start the game. Please try again.', [{ text: 'OK', type: 'ok' }])
    }
  }

  function setLaunchStep(label: string) {
    launch = { visible: true, label, percent: null, indeterminate: true }
  }

  $effect(() => {
    const profile = $selectedProfile
    if (selectedSlug) void refreshServerStatus(profile)
    else if (!$profiles.length) {
      serverState = 'offline'
      players = ''
    }
  })

  $effect(() => {
    const currentAccount = $account
    const request = ++profileRequest
    if (!currentAccount) {
      profiles.set([])
      selectedProfile.set(null)
      return
    }

    void profilesApi
      .get(currentAccount)
      .then((list) => {
        if (request !== profileRequest) return
        profiles.set(list)
        const current = getStoreValue(selectedProfile)
        if (current && list.some((profile) => profile.slug === current.slug)) return
        selectedProfile.set(list[0] ?? null)
      })
      .catch((error) => {
        if (request === profileRequest) logger.error('Could not load profiles:', error)
      })
  })
</script>

<div id="view-home" class="view">
  <aside class="home-sidebar">
    <div class="sidebar-top">
      <div class="user-profile">
        <img src={$avatar?.url ?? 'https://minotar.net/avatar/steve/256.png'} id="user-avatar" alt="Skin" />
        <div class="user-details"><span id="user-name">{$account?.name ?? 'Undefined'}</span><span class="rank-badge">Member</span></div>
      </div>
      <button class="btn btn-secondary" title="Settings" aria-label="Settings" onclick={() => overlay.set('settings')}
        ><i class="fa-fw fa-solid fa-gear"></i></button
      >
    </div>
    <div class="sidebar-middle">
      <h3 class="shop-header">
        <span>Shop</span>
        <span class="shop-link">
          <a href="https://emlproject.pages.dev" target="_blank" rel="noreferrer"><i class="fa-fw fa-solid fa-cart-shopping"></i> Visit shop...</a>
        </span>
      </h3>
      {#each [{ image: goldImage, name: 'Gold Rank', price: '$9.99' }, { image: silverImage, name: 'Silver Rank', price: '$6.99' }, { image: bronzeImage, name: 'Bronze Rank', price: '$3.99' }, { image: boxImage, name: 'Mystery Box', price: '$5.99' }] as item}
        <div class="shop-item">
          <img src={item.image} class="shop-item-image" alt={item.name} />
          <div class="shop-item-details"><span class="item-name">{item.name}</span><span class="item-price">{item.price}</span></div>
        </div>
      {/each}
    </div>
    <div class="sidebar-bottom">
      <div class="profile-selector-container" class:open={profileMenuOpen} bind:this={profileSelector}>
        <button class="selected-profile" aria-expanded={profileMenuOpen} onclick={() => (profileMenuOpen = !profileMenuOpen)}>
          <span id="current-profile-name">{$selectedProfile?.name ?? 'Select Profile'}</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        {#if profileMenuOpen}
          <div class="profile-dropdown" id="profile-dropdown" transition:slide={{ duration: 100 }}>
            {#each $profiles as item (item.slug)}
              <button class="profile-option" class:active={$selectedProfile?.slug === item.slug} onclick={() => chooseProfile(item)}>
                {#if item.visibility === 'PROTECTED'}<i
                    class="fa-fw fa-solid"
                    class:fa-lock={!$profileTokens[item.slug]}
                    class:fa-lock-open={!!$profileTokens[item.slug]}
                  ></i>&nbsp;&nbsp;{/if}{item.name}
              </button>
            {/each}
            {#if !$profiles.length}<span class="profile-option">No profiles available</span>{/if}
          </div>
        {/if}
      </div>
      <div class="server-status">
        <div class="status-indicator" id="server-status-indicator">
          <div
            class="status-dot"
            class:pinging={serverState === 'pinging'}
            class:online={serverState === 'online'}
            class:offline={serverState === 'offline'}
          ></div>
          <span class="status-text">{serverState === 'pinging' ? 'Pinging...' : serverState === 'online' ? 'Online' : 'Offline'}</span>
        </div>
        {#if players}<div class="player-count"><i class="fa-fw fa-solid fa-users"></i>&nbsp;&nbsp;{players}</div>{/if}
      </div>
      <div class="launch-area">
        {#if !launch.visible}<button id="btn-play" onclick={startGame}>PLAY</button>
        {:else}<div class="progress-container" id="launch-progress-container">
            <div class="progress-info"><span>{launch.label}</span><span>{launch.percent === null ? '' : `${Math.round(launch.percent)}%`}</span></div>
            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                class:indeterminate={launch.indeterminate}
                style:width={launch.percent === null ? undefined : `${launch.percent}%`}
              ></div>
            </div>
          </div>{/if}
      </div>
    </div>
  </aside>
  <main class="home-content">
    <div class="news-header">
      <h2>News feed</h2>
      <div class="social-links">
        <a href="https://emlproject.com/discord/other" target="_blank" rel="noreferrer" class="btn btn-icon-only" aria-label="Discord"
          ><i class="fa-brands fa-discord"></i></a
        >
        <a href="https://x.com/EMLProject" target="_blank" rel="noreferrer" class="btn btn-icon-only" aria-label="X"
          ><i class="fa-brands fa-x-twitter"></i></a
        >
        <a href="https://emlproject.com" target="_blank" rel="noreferrer" class="btn btn-icon-only" aria-label="Website"
          ><i class="fa-solid fa-globe"></i></a
        >
      </div>
    </div>
    <hr />
    <div class="news-list" id="news-list">
      {#if newsLoading}<div class="news-empty">Loading news...</div>
      {:else if newsError}<div class="news-empty">
          <span>News could not be loaded.</span> <button class="btn-text" onclick={loadNews}>Retry</button>
        </div>
      {:else if !newsItems.length}<div class="news-empty">No news available.</div>
      {:else}
        {#each newsItems as item (item.id ?? String(item.createdAt))}
          <article class="news-article">
            <div class="article-meta">
              <div class="author">
                <img src={`https://minotar.net/helm/${item.author.username ?? 'steve'}/24`} alt="" /><span
                  >{item.author.username ?? 'Admin Team'}</span
                >
              </div>
              <span class="separator">•</span><span class="date">{formatDate(item.createdAt)}</span><span class="separator">•</span>
              <div class="tags-container">
                {#each item.tags ?? [] as tag}<span class="tag" style:color={tag.color} style:background-color={tagBackground(tag.color)}
                    >{tag.name ?? tag.title ?? ''}</span
                  >{/each}
              </div>
            </div>
            <h3>{item.title}</h3>
            {#if item.image}<img src={item.image} alt="News" onerror={(e: any) => (e.currentTarget.hidden = true)} />{/if}
            <div class="article-content">{@html renderMarkdown(item.content)}</div>
          </article>
        {/each}
      {/if}
    </div>
  </main>
</div>

<style lang="scss">
  @use '../static/styles/home.scss' as *;

  :global(.news-article .tags-container .tag.update) {
    background: rgba(33, 150, 243, 0.15);
    color: #64b5f6;
    border: 1px solid rgba(33, 150, 243, 0.3);
  }

  :global(.news-article .tags-container .tag.event) {
    background: rgba(255, 152, 0, 0.15);
    color: #ffb74d;
    border: 1px solid rgba(255, 152, 0, 0.3);
  }

  :global(.news-article .tags-container .tag.info) {
    background: rgba(158, 158, 158, 0.15);
    color: #e0e0e0;
    border: 1px solid rgba(158, 158, 158, 0.3);
  }

  :global(.news-article .article-content > *:first-child) {
    margin-top: 0;
  }
  :global(.news-article .article-content > *:last-child) {
    margin-bottom: 0;
  }
  :global(.news-article .article-content p) {
    margin: 10px 0;
  }
  :global(.news-article .article-content h1) {
    font-size: 24px;
    margin: 16px 0;
    padding-bottom: 8px;
  }
  :global(.news-article .article-content h2) {
    font-size: 20px;
    margin: 16px 0;
    padding-bottom: 7px;
  }
  :global(.news-article .article-content h3) {
    font-size: 18px;
    margin: 16px 0;
    padding-bottom: 6px;
  }
  :global(.news-article .article-content h4) {
    font-size: 16px;
    margin: 12px 0;
    padding-bottom: 0;
  }
  :global(.news-article .article-content ul) {
    margin: 10px 0 10px 20px;
  }
  :global(.news-article .article-content a) {
    text-decoration: underline;
  }
  :global(.news-article .article-content img) {
    border-radius: 5px;
    margin-top: 1em;
    border: 1px solid var(--glass-border);
    max-width: 100%;
    height: auto;
    object-fit: cover;
  }
</style>
