import { ipcMain, BrowserWindow, app } from 'electron'
import { Launcher } from 'eml-lib'
import type { Account } from 'eml-lib'
import type { IGameSettings } from './settings'
import logger from 'electron-log/main'
import { ADMINTOOL_URL } from '../const'
import type { StatsIntegration } from './stats'
import type { CrashReportIntegration } from './crashreports'

export function registerLauncherHandlers(mainWindow: BrowserWindow, integrations: { stats: StatsIntegration; crashReports: CrashReportIntegration }) {
  ipcMain.handle('game:launch', (_event, payload: { account: Account; settings: IGameSettings; profileSlug?: string; token?: string }) => {
    const { account, settings, profileSlug } = payload
    const java = settings.java === 'system' ? { install: 'manual' as const, absolutePath: 'java' } : { install: 'auto' as const }
    logger.log('Launching')

    const launcher = new Launcher({
      url: ADMINTOOL_URL,
      root: 'goldfrite',
      profile: { slug: profileSlug, token: payload.token },
      account: account,
      cleaning: {
        enabled: false
      },
      java: java,
      memory: {
        min: +settings.memory.min * 1024,
        max: +settings.memory.max * 1024
      },
      window: {
        width: settings.resolution.width,
        height: settings.resolution.height,
        fullscreen: settings.resolution.fullscreen
      }
    })
    integrations.stats.attach(launcher)
    integrations.crashReports.attachLauncher(launcher)
    let gameCrashed = false

    launcher.on('launch_compute_download', () => {
      logger.log('Computing download...')
      mainWindow.webContents.send('game:launch_compute_download')
    })

    launcher.on('launch_download', (download) => {
      logger.log(`Downloading ${download.total.amount} files (${download.total.size} B).`)
      mainWindow.webContents.send('game:launch_download', download)
    })
    launcher.on('download_progress', (progress) => {
      mainWindow.webContents.send('game:download_progress', progress)
    })
    launcher.on('download_error', (error) => {
      logger.error(`Error downloading ${error.filename}: ${error.message}`)
      mainWindow.webContents.send('game:download_error', error)
    })
    launcher.on('download_end', (info) => {
      logger.log(`Downloaded ${info.downloaded.amount} files.`)
      mainWindow.webContents.send('game:download_end', info)
    })

    launcher.on('launch_install_loader', (loader) => {
      logger.log(`Installing loader ${loader.loader} ${loader.version}...`)
      mainWindow.webContents.send('game:launch_install_loader', loader)
    })

    launcher.on('launch_extract_natives', () => {
      logger.log('Extracting natives...')
      mainWindow.webContents.send('game:launch_extract_natives')
    })
    launcher.on('extract_progress', (progress) => {
      logger.log(`Extracted ${progress.filename}.`)
      mainWindow.webContents.send('game:extract_progress', progress)
    })
    launcher.on('extract_end', (info) => {
      logger.log(`Extracted ${info.amount} files.`)
      mainWindow.webContents.send('game:extract_end', info)
    })

    launcher.on('launch_copy_assets', () => {
      logger.log('Copying assets...')
      mainWindow.webContents.send('game:launch_copy_assets')
    })
    launcher.on('copy_progress', (progress) => {
      logger.log(`Copied ${progress.filename} to ${progress.dest}.`)
      mainWindow.webContents.send('game:copy_progress', progress)
    })
    launcher.on('copy_end', (info) => {
      logger.log(`Copied ${info.amount} files.`)
      mainWindow.webContents.send('game:copy_end', info)
    })

    launcher.on('launch_patch_loader', () => {
      logger.log('Patching loader...')
      mainWindow.webContents.send('game:launch_patch_loader')
    })
    launcher.on('patch_progress', (progress) => {
      mainWindow.webContents.send('game:patch_progress', progress)
    })
    launcher.on('patch_error', (error) => {
      logger.error(`Error patching ${error.filename}: ${error.message}`)
      mainWindow.webContents.send('game:patch_error', error)
    })
    launcher.on('patch_end', (info) => {
      logger.log(`Patched ${info.amount} files.`)
      mainWindow.webContents.send('game:patch_end', info)
    })

    launcher.on('launch_check_java', () => {
      logger.log('Checking Java...')
      mainWindow.webContents.send('game:launch_check_java')
    })
    launcher.on('java_info', (info) => {
      logger.log(`Using Java ${info.version} ${info.arch}`)
      mainWindow.webContents.send('game:java_info', info)
    })

    launcher.on('launch_clean', () => {
      logger.log('Cleaning game directory...')
      mainWindow.webContents.send('game:launch_clean')
    })
    launcher.on('clean_progress', (progress) => {
      mainWindow.webContents.send('game:clean_progress', progress)
    })
    launcher.on('clean_end', (info) => {
      logger.log(`Cleaned ${info.amount} files.`)
      mainWindow.webContents.send('game:clean_end', info)
    })

    launcher.on('launch_launch', (info) => {
      logger.log(
        `Launching Minecraft ${info.minecraft.version} (${info.minecraft.loader?.loader ?? 'vanilla'}${info.minecraft.loader?.version ? ` ${info.minecraft.loader.version}` : ''})...`
      )
      mainWindow.webContents.send('game:launch_launch', info)
      if (settings.launcherAction === 'close') {
        setTimeout(() => app.quit(), 5000)
      } else if (settings.launcherAction === 'hide') {
        setTimeout(() => {
          if (!gameCrashed && !mainWindow.isDestroyed()) mainWindow.minimize()
        }, 5000)
      }
      mainWindow.webContents.send('game:launched')
    })
    launcher.on('launch_data', (message) => {
      logger.log(message)
      mainWindow.webContents.send('game:launch_data', message)
    })
    launcher.on('launch_close', (code) => {
      logger.log(`Closed with code ${code}.`)
      mainWindow.webContents.send('game:launch_close', code)
    })

    launcher.on('launch_crash', () => {
      gameCrashed = true
    })

    launcher.on('launch_debug', (message) => {
      mainWindow.webContents.send('game:launch_debug', message)
    })
    launcher.on('patch_debug', (message) => {
      mainWindow.webContents.send('game:patch_debug', message)
    })

    try {
      void launcher.launch().catch((err) => logger.error('Launcher error:', err))
    } catch (err) {
      logger.error('Launcher error:', err)
    }
  })
}
