import { contextBridge, ipcRenderer } from 'electron'
import type { IGameSettings, ISystemInfo } from './handlers/settings'
import type { IAuthResponse } from './handlers/auth'
import type { Account, CleanerEvents, DownloaderEvents, FilesManagerEvents, JavaEvents, LauncherEvents, PatcherEvents } from 'eml-lib'

console.log('Preload script loaded')

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (): Promise<IAuthResponse> => ipcRenderer.invoke('auth:login'),
    refresh: (): Promise<IAuthResponse> => ipcRenderer.invoke('auth:refresh'),
    logout: (): Promise<{ success: boolean }> => ipcRenderer.invoke('auth:logout')
  },
  game: {
    launch: (payload: { account: Account; settings: IGameSettings }) => {
      ipcRenderer.invoke('game:launch', payload)
    },

    launchComputeDownload: (callback: () => void) => ipcRenderer.on('game:launch_compute_download', (_event) => callback()),

    launchDownload: (callback: (value: LauncherEvents['launch_download'][0]) => void) =>
      ipcRenderer.on('game:launch_download', (_event, value) => callback(value)),
    downloadProgress: (callback: (value: DownloaderEvents['download_progress'][0]) => void) =>
      ipcRenderer.on('game:download_progress', (_event, value) => callback(value)),
    downloadError: (callback: (value: DownloaderEvents['download_error'][0]) => void) =>
      ipcRenderer.on('game:download_error', (_event, value) => callback(value)),
    downloadEnd: (callback: (value: DownloaderEvents['download_end'][0]) => void) =>
      ipcRenderer.on('game:download_end', (_event, value) => callback(value)),

    launchInstallLoader: (callback: (value: LauncherEvents['launch_install_loader'][0]) => void) =>
      ipcRenderer.on('game:launch_install_loader', (_event, value) => callback(value)),

    launchExtractNatives: (callback: () => void) => ipcRenderer.on('game:launch_extract_natives', (_event) => callback()),
    extractProgress: (callback: (value: FilesManagerEvents['extract_progress'][0]) => void) =>
      ipcRenderer.on('game:extract_progress', (_event, value) => callback(value)),
    extractEnd: (callback: (value: FilesManagerEvents['extract_end'][0]) => void) =>
      ipcRenderer.on('game:extract_end', (_event, value) => callback(value)),
    launchCopyAssets: (callback: () => void) => ipcRenderer.on('game:launch_copy_assets', (_event) => callback()),
    copyProgress: (callback: (value: FilesManagerEvents['copy_progress'][0]) => void) =>
      ipcRenderer.on('game:copy_progress', (_event, value) => callback(value)),
    copyEnd: (callback: (value: FilesManagerEvents['copy_end'][0]) => void) => ipcRenderer.on('game:copy_end', (_event, value) => callback(value)),
    launchPatchLoader: (callback: () => void) => ipcRenderer.on('game:launch_patch_loader', (_event) => callback()),
    patchProgress: (callback: (value: PatcherEvents['patch_progress'][0]) => void) =>
      ipcRenderer.on('game:patch_progress', (_event, value) => callback(value)),
    patchError: (callback: (value: PatcherEvents['patch_error'][0]) => void) =>
      ipcRenderer.on('game:patch_error', (_event, value) => callback(value)),
    patchEnd: (callback: (value: PatcherEvents['patch_end'][0]) => void) => ipcRenderer.on('game:patch_end', (_event, value) => callback(value)),
    launchCheckJava: (callback: () => void) => ipcRenderer.on('game:launch_check_java', (_event) => callback()),
    javaInfo: (callback: (value: JavaEvents['java_info'][0]) => void) => ipcRenderer.on('game:java_info', (_event, value) => callback(value)),

    launchClean: (callback: () => void) => ipcRenderer.on('game:launch_clean', (_event) => callback()),
    cleanProgress: (callback: (value: CleanerEvents['clean_progress'][0]) => void) =>
      ipcRenderer.on('game:clean_progress', (_event, value) => callback(value)),
    cleanEnd: (callback: (value: CleanerEvents['clean_end'][0]) => void) => ipcRenderer.on('game:clean_end', (_event, value) => callback(value)),
    launchLaunch: (callback: (value: LauncherEvents['launch_launch'][0]) => void) =>
      ipcRenderer.on('game:launch_launch', (_event, value) => callback(value)),
    launched: (callback: () => void) => ipcRenderer.on('game:launched', (_event) => callback()),

    launchData: (callback: (value: LauncherEvents['launch_data'][0]) => void) =>
      ipcRenderer.on('game:launch_data', (_event, value) => callback(value)),
    launchClose: (callback: (value: any) => void) => ipcRenderer.on('game:launch_close', (_event, value) => callback(value)),
    launchDebug: (callback: (value: LauncherEvents['launch_debug'][0]) => void) =>
      ipcRenderer.on('game:launch_debug', (_event, value) => callback(value)),
    patchDebug: (callback: (value: PatcherEvents['patch_debug'][0]) => void) => ipcRenderer.on('game:patch_debug', (_event, value) => callback(value))
  },
  settings: {
    get: (): Promise<IGameSettings> => ipcRenderer.invoke('settings:get'),
    set: (s: IGameSettings): Promise<boolean> => ipcRenderer.invoke('settings:set', s),
    pickJava: (): Promise<string | null> => ipcRenderer.invoke('settings:pick-java')
  },
  system: {
    getInfo: (): Promise<ISystemInfo> => ipcRenderer.invoke('system:info')
  }
})
