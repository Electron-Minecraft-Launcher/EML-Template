import type { IGameSettings, ISystemInfo } from '../electron/handlers/settings'
import type { IAuthResponse } from '../electron/handlers/auth'
import type { Account, CleanerEvents, DownloaderEvents, FilesManagerEvents, JavaEvents, LauncherEvents, PatcherEvents } from 'eml-lib'

declare global {
  interface Window {
    api: {
      auth: {
        login: () => Promise<IAuthResponse>
        refresh: () => Promise<IAuthResponse>
        logout: () => Promise<{ success: boolean }>
      }
      game: {
        launch: (payload: { account: Account; settings: IGameSettings }) => Promise<void>

        launchComputeDownload: (callback: () => void) => void

        launchDownload: (callback: (value: LauncherEvents['launch_download'][0]) => void) => void
        downloadProgress: (callback: (value: DownloaderEvents['download_progress'][0]) => void) => void
        downloadError: (callback: (value: DownloaderEvents['download_error'][0]) => void) => void
        downloadEnd: (callback: (value: DownloaderEvents['download_end'][0]) => void) => void

        launchInstallLoader: (callback: (value: LauncherEvents['launch_install_loader'][0]) => void) => void

        launchExtractNatives: (callback: () => void) => void
        extractProgress: (callback: (value: FilesManagerEvents['extract_progress'][0]) => void) => void
        extractEnd: (callback: (value: FilesManagerEvents['extract_end'][0]) => void) => void
        launchCopyAssets: (callback: () => void) => void
        copyProgress: (callback: (value: FilesManagerEvents['copy_progress'][0]) => void) => void
        copyEnd: (callback: (value: FilesManagerEvents['copy_end'][0]) => void) => void

        launchPatchLoader: (callback: () => void) => void
        patchProgress: (callback: (value: PatcherEvents['patch_progress'][0]) => void) => void
        patchError: (callback: (value: PatcherEvents['patch_error'][0]) => void) => void
        patchEnd: (callback: (value: PatcherEvents['patch_end'][0]) => void) => void

        launchCheckJava: (callback: () => void) => void
        javaInfo: (callback: (value: JavaEvents['java_info'][0]) => void) => void

        launchClean: (callback: () => void) => void
        cleanProgress: (callback: (value: CleanerEvents['clean_progress'][0]) => void) => void
        cleanEnd: (callback: (value: CleanerEvents['clean_end'][0]) => void) => void
        launchLaunch: (callback: (value: LauncherEvents['launch_launch'][0]) => void) => void
        launched: (callback: () => void) => void

        launchData: (callback: (value: LauncherEvents['launch_data'][0]) => void) => void
        launchClose: (callback: (value: any) => void) => void
        launchDebug: (callback: (value: LauncherEvents['launch_debug'][0]) => void) => void
        patchDebug: (callback: (value: PatcherEvents['patch_debug'][0]) => void) => void
      }
      settings: {
        get: () => Promise<IGameSettings>
        set: (s: IGameSettings) => Promise<boolean>
        pickJava: () => Promise<string | null>
      }
      system: {
        getInfo: () => Promise<ISystemInfo>
      }
    }
  }
}

export const auth = {
  login: async () => {
    return await window.api.auth.login()
  },
  logout: async () => {
    return await window.api.auth.logout()
  },
  refresh: async () => {
    return await window.api.auth.refresh()
  }
}

export const game = {
  launch: async (payload: { account: Account; settings: IGameSettings }) => {
    return await window.api.game.launch(payload)
  },
  launchComputeDownload: (callback: () => void) => {
    return window.api.game.launchComputeDownload(callback)
  },

  launchDownload: (callback: (value: LauncherEvents['launch_download'][0]) => void) => {
    return window.api.game.launchDownload(callback)
  },
  downloadProgress: (callback: (value: DownloaderEvents['download_progress'][0]) => void) => {
    return window.api.game.downloadProgress(callback)
  },
  downloadError: (callback: (value: DownloaderEvents['download_error'][0]) => void) => {
    return window.api.game.downloadError(callback)
  },
  downloadEnd: (callback: (value: DownloaderEvents['download_end'][0]) => void) => {
    return window.api.game.downloadEnd(callback)
  },

  launchInstallLoader: (callback: (value: LauncherEvents['launch_install_loader'][0]) => void) => {
    return window.api.game.launchInstallLoader(callback)
  },

  launchExtractNatives: (callback: () => void) => {
    return window.api.game.launchExtractNatives(callback)
  },
  extractProgress: (callback: (value: FilesManagerEvents['extract_progress'][0]) => void) => {
    return window.api.game.extractProgress(callback)
  },
  extractEnd: (callback: (value: FilesManagerEvents['extract_end'][0]) => void) => {
    return window.api.game.extractEnd(callback)
  },
  launchCopyAssets: (callback: () => void) => {
    return window.api.game.launchCopyAssets(callback)
  },
  copyProgress: (callback: (value: FilesManagerEvents['copy_progress'][0]) => void) => {
    return window.api.game.copyProgress(callback)
  },
  copyEnd: (callback: (value: FilesManagerEvents['copy_end'][0]) => void) => {
    return window.api.game.copyEnd(callback)
  },

  launchPatchLoader: (callback: () => void) => {
    return window.api.game.launchPatchLoader(callback)
  },
  patchProgress: (callback: (value: PatcherEvents['patch_progress'][0]) => void) => {
    return window.api.game.patchProgress(callback)
  },
  patchError: (callback: (value: PatcherEvents['patch_error'][0]) => void) => {
    return window.api.game.patchError(callback)
  },
  patchEnd: (callback: (value: PatcherEvents['patch_end'][0]) => void) => {
    return window.api.game.patchEnd(callback)
  },

  launchCheckJava: (callback: () => void) => {
    return window.api.game.launchCheckJava(callback)
  },
  javaInfo: (callback: (value: JavaEvents['java_info'][0]) => void) => {
    return window.api.game.javaInfo(callback)
  },

  launchClean: (callback: () => void) => {
    return window.api.game.launchClean(callback)
  },
  cleanProgress: (callback: (value: CleanerEvents['clean_progress'][0]) => void) => {
    return window.api.game.cleanProgress(callback)
  },
  cleanEnd: (callback: (value: CleanerEvents['clean_end'][0]) => void) => {
    return window.api.game.cleanEnd(callback)
  },

  launchLaunch: (callback: (value: LauncherEvents['launch_launch'][0]) => void) => {
    return window.api.game.launchLaunch(callback)
  },
  launched: (callback: () => void) => {
    return window.api.game.launched(callback)
  },

  launchData: (callback: (value: LauncherEvents['launch_data'][0]) => void) => {
    return window.api.game.launchData(callback)
  },
  launchClose: (callback: (value: any) => void) => {
    return window.api.game.launchClose(callback)
  },
  launchDebug: (callback: (value: LauncherEvents['launch_debug'][0]) => void) => {
    return window.api.game.launchDebug(callback)
  },
  patchDebug: (callback: (value: PatcherEvents['patch_debug'][0]) => void) => {
    return window.api.game.patchDebug(callback)
  }
}

export const settings = {
  get: () => window.api.settings.get(),
  set: (s: IGameSettings) => window.api.settings.set(s),
  pickJava: () => window.api.settings.pickJava()
}

export const system = {
  getInfo: () => window.api.system.getInfo()
}
