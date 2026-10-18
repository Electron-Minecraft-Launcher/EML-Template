import { contextBridge, ipcRenderer } from 'electron'
import type { IGameSettings, ISystemInfo } from './handlers/settings'
import type { IAuthResponse } from './handlers/auth'
import type {
  Account,
  BootstrapEvents,
  CleanerEvents,
  DownloaderEvents,
  FileManagerEvents,
  IAvatar,
  IBackground,
  IBootstraps,
  ICape,
  IMaintenance,
  INews,
  IProfile,
  IServerStatus,
  ISkin,
  JavaEvents,
  LauncherEvents,
  PatcherEvents
} from 'eml-lib'

console.log('Preload script loaded')

function subscribe(channel: string, callback: (...args: any[]) => void): () => void {
  const listener = (_event: unknown, ...args: any[]) => callback(...args)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (): Promise<IAuthResponse> => ipcRenderer.invoke('auth:login'),
    refresh: (): Promise<IAuthResponse> => ipcRenderer.invoke('auth:refresh'),
    logout: (): Promise<{ success: boolean }> => ipcRenderer.invoke('auth:logout')
  },
  profiles: {
    get: (account: Account): Promise<IProfile[]> => ipcRenderer.invoke('profiles:get', account),
    auth: (slug: string, password: string): Promise<{ success: true; token: string; slug: string } | { success: false; error: string }> =>
      ipcRenderer.invoke('profiles:auth', slug, password)
  },
  game: {
    launch: (payload: { account: Account; settings: IGameSettings; profileSlug?: string, token?: string }) => {
      return ipcRenderer.invoke('game:launch', payload)
    },

    launchComputeDownload: (callback: () => void) => subscribe('game:launch_compute_download', callback),

    launchDownload: (callback: (value: LauncherEvents['launch_download'][0]) => void) =>
      subscribe('game:launch_download', callback),
    downloadProgress: (callback: (value: DownloaderEvents['download_progress'][0]) => void) =>
      subscribe('game:download_progress', callback),
    downloadError: (callback: (value: DownloaderEvents['download_error'][0]) => void) =>
      subscribe('game:download_error', callback),
    downloadEnd: (callback: (value: DownloaderEvents['download_end'][0]) => void) =>
      ipcRenderer.on('game:download_end', (_event, value) => callback(value)),

    launchInstallLoader: (callback: (value: LauncherEvents['launch_install_loader'][0]) => void) =>
      subscribe('game:launch_install_loader', callback),

    launchExtractNatives: (callback: () => void) => subscribe('game:launch_extract_natives', callback),
    extractProgress: (callback: (value: FileManagerEvents['extract_progress'][0]) => void) =>
      ipcRenderer.on('game:extract_progress', (_event, value) => callback(value)),
    extractEnd: (callback: (value: FileManagerEvents['extract_end'][0]) => void) =>
      ipcRenderer.on('game:extract_end', (_event, value) => callback(value)),
    launchCopyAssets: (callback: () => void) => subscribe('game:launch_copy_assets', callback),
    copyProgress: (callback: (value: FileManagerEvents['copy_progress'][0]) => void) =>
      ipcRenderer.on('game:copy_progress', (_event, value) => callback(value)),
    copyEnd: (callback: (value: FileManagerEvents['copy_end'][0]) => void) => ipcRenderer.on('game:copy_end', (_event, value) => callback(value)),
    launchPatchLoader: (callback: () => void) => subscribe('game:launch_patch_loader', callback),
    patchProgress: (callback: (value: PatcherEvents['patch_progress'][0]) => void) =>
      ipcRenderer.on('game:patch_progress', (_event, value) => callback(value)),
    patchError: (callback: (value: PatcherEvents['patch_error'][0]) => void) =>
      subscribe('game:patch_error', callback),
    patchEnd: (callback: (value: PatcherEvents['patch_end'][0]) => void) => ipcRenderer.on('game:patch_end', (_event, value) => callback(value)),
    launchCheckJava: (callback: () => void) => ipcRenderer.on('game:launch_check_java', (_event) => callback()),
    javaInfo: (callback: (value: JavaEvents['java_info'][0]) => void) => ipcRenderer.on('game:java_info', (_event, value) => callback(value)),

    launchClean: (callback: () => void) => ipcRenderer.on('game:launch_clean', (_event) => callback()),
    cleanProgress: (callback: (value: CleanerEvents['clean_progress'][0]) => void) =>
      ipcRenderer.on('game:clean_progress', (_event, value) => callback(value)),
    cleanEnd: (callback: (value: CleanerEvents['clean_end'][0]) => void) => ipcRenderer.on('game:clean_end', (_event, value) => callback(value)),
    launchLaunch: (callback: (value: LauncherEvents['launch_launch'][0]) => void) =>
      subscribe('game:launch_launch', callback),
    launched: (callback: () => void) => subscribe('game:launched', callback),

    launchData: (callback: (value: LauncherEvents['launch_data'][0]) => void) =>
      ipcRenderer.on('game:launch_data', (_event, value) => callback(value)),
    launchClose: (callback: (value: any) => void) => ipcRenderer.on('game:launch_close', (_event, value) => callback(value)),
    launchDebug: (callback: (value: LauncherEvents['launch_debug'][0]) => void) =>
      ipcRenderer.on('game:launch_debug', (_event, value) => callback(value)),
    patchDebug: (callback: (value: PatcherEvents['patch_debug'][0]) => void) => ipcRenderer.on('game:patch_debug', (_event, value) => callback(value))
  },
  crashReports: {
    onDetected: (callback: (value: { id: string; exitCode: number; date: string; profile: string; minecraftVersion: string }) => void) =>
      subscribe('crashreports:detected', callback),
    send: (id: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('crashreports:send', id),
    dismiss: (id: string): Promise<void> => ipcRenderer.invoke('crashreports:dismiss', id)
  },
  skin: {
    reload: (account: Account): Promise<void | null> => ipcRenderer.invoke('skin:reload', account),
    getSkin: (account?: Account): Promise<ISkin[] | null> => ipcRenderer.invoke('skin:get_skin', account),
    getCape: (account?: Account): Promise<ICape[] | null> => ipcRenderer.invoke('skin:get_cape', account),
    getAvatar: (account?: Account): Promise<IAvatar | null> => ipcRenderer.invoke('skin:get_avatar', account),
    updateSkin: (source: string | Blob, model?: 'classic' | 'slim'): Promise<ISkin[] | null> => ipcRenderer.invoke('skin:update_skin', source, model),
    // updateCape: (source: string | Blob): Promise<ICape[] | null> => ipcRenderer.invoke('skin:update_cape', source), --- Not implemented with Microsoft accounts ---
    switchCape: (id: string): Promise<ICape[] | null> => ipcRenderer.invoke('skin:switch_cape', id),
    deleteSkin: (id: string): Promise<ISkin[] | null> => ipcRenderer.invoke('skin:delete_skin', id),
    // deleteCape: (): Promise<ICape[] | null> => ipcRenderer.invoke('skin:delete_cape'), --- Not implemented with Microsoft accounts ---
    hideCape: (): Promise<ICape[] | null> => ipcRenderer.invoke('skin:hide_cape')
  },
  server: {
    getStatus: (ip: string, port?: number): Promise<IServerStatus> => ipcRenderer.invoke('server:status', ip, port)
  },
  news: {
    getNews: (): Promise<INews[]> => ipcRenderer.invoke('news:get_news'),
    getCategories: (): Promise<any[]> => ipcRenderer.invoke('news:get_categories')
  },
  background: {
    get: (): Promise<IBackground | null> => ipcRenderer.invoke('background:get')
  },
  maintenance: {
    get: (): Promise<IMaintenance | null> => ipcRenderer.invoke('maintenance:get')
  },
  bootstraps: {
    check: (): Promise<IBootstraps> => ipcRenderer.invoke('bootstraps:check'),
    download: (): Promise<string> => ipcRenderer.invoke('bootstraps:download'),
    install: (): Promise<void> => ipcRenderer.invoke('bootstraps:install'),
    downloadProgress: (callback: (value: DownloaderEvents['download_progress'][0]) => void) =>
      ipcRenderer.on('bootstraps:download_progress', (_event, value) => callback(value)),
    downloadEnd: (callback: (value: DownloaderEvents['download_end'][0]) => void) =>
      ipcRenderer.on('bootstraps:download_end', (_event, value) => callback(value)),
    error: (callback: (value: BootstrapEvents['bootstraps_error'][0]) => void) =>
      ipcRenderer.on('bootstraps:error', (_event, value) => callback(value))
  },
  settings: {
    get: (): Promise<IGameSettings> => ipcRenderer.invoke('settings:get'),
    set: (s: IGameSettings): Promise<boolean> => ipcRenderer.invoke('settings:set', s),
    pickJava: (): Promise<string | null> => ipcRenderer.invoke('settings:pick_java')
  },
  system: {
    getInfo: (): Promise<ISystemInfo> => ipcRenderer.invoke('system:info')
  }
})
