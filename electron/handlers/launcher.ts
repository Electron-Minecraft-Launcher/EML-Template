import { ipcMain, BrowserWindow, app } from 'electron'
import { Launcher } from 'eml-lib'
import type { Account } from 'eml-lib'
import type { IGameSettings } from './settings'
import { ADMINTOOL_URL } from '../const'

export function registerLauncherHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('game:launch', (_event, payload: { account: Account; settings: IGameSettings }) => {
    const { account, settings } = payload
    const java = settings.java === 'system' ? { install: 'manual' as const, absolutePath: 'java' } : { install: 'auto' as const }
    console.log('Launching')

    const launcher = new Launcher({
      url: ADMINTOOL_URL,
      serverId: 'goldfrite',
      account: account,
      cleaning: {
        clean: false
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

    launcher.on('launch_compute_download', () => {
      console.log('Computing download...')
      mainWindow.webContents.send('game:launch_compute_download')
    })

    launcher.on('launch_download', (download) => {
      console.log(`Downloading ${download.total.amount} files (${download.total.size} B).`)
      mainWindow.webContents.send('game:launch_download', download)
    })
    launcher.on('download_progress', (progress) => {
      mainWindow.webContents.send('game:download_progress', progress)
    })
    launcher.on('download_error', (error) => {
      console.error(`Error downloading ${error.filename}: ${error.message}`)
      mainWindow.webContents.send('game:download_error', error)
    })
    launcher.on('download_end', (info) => {
      console.log(`Downloaded ${info.downloaded.amount} files.`)
      mainWindow.webContents.send('game:download_end', info)
    })

    launcher.on('launch_install_loader', (loader) => {
      console.log(`Installing loader ${loader.type} ${loader.loaderVersion}...`)
      mainWindow.webContents.send('game:launch_install_loader', loader)
    })

    launcher.on('launch_extract_natives', () => {
      console.log('Extracting natives...')
      mainWindow.webContents.send('game:launch_extract_natives')
    })
    launcher.on('extract_progress', (progress) => {
      console.log(`Extracted ${progress.filename}.`)
      mainWindow.webContents.send('game:extract_progress', progress)
    })
    launcher.on('extract_end', (info) => {
      console.log(`Extracted ${info.amount} files.`)
      mainWindow.webContents.send('game:extract_end', info)
    })

    launcher.on('launch_copy_assets', () => {
      console.log('Copying assets...')
      mainWindow.webContents.send('game:launch_copy_assets')
    })
    launcher.on('copy_progress', (progress) => {
      console.log(`Copied ${progress.filename} to ${progress.dest}.`)
      mainWindow.webContents.send('game:copy_progress', progress)
    })
    launcher.on('copy_end', (info) => {
      console.log(`Copied ${info.amount} files.`)
      mainWindow.webContents.send('game:copy_end', info)
    })

    launcher.on('launch_patch_loader', () => {
      console.log('Patching loader...')
      mainWindow.webContents.send('game:launch_patch_loader')
    })
    launcher.on('patch_progress', (progress) => {
      mainWindow.webContents.send('game:patch_progress', progress)
    })
    launcher.on('patch_error', (error) => {
      console.error(`Error patching ${error.filename}: ${error.message}`)
      mainWindow.webContents.send('game:patch_error', error)
    })
    launcher.on('patch_end', (info) => {
      console.log(`Patched ${info.amount} files.`)
      mainWindow.webContents.send('game:patch_end', info)
    })

    launcher.on('launch_check_java', () => {
      console.log('Checking Java...')
      mainWindow.webContents.send('game:launch_check_java')
    })
    launcher.on('java_info', (info) => {
      console.log(`Using Java ${info.version} ${info.arch}`)
      mainWindow.webContents.send('game:java_info', info)
    })

    launcher.on('launch_clean', () => {
      console.log('Cleaning game directory...')
      mainWindow.webContents.send('game:launch_clean')
    })
    launcher.on('clean_progress', (progress) => {
      mainWindow.webContents.send('game:clean_progress', progress)
    })
    launcher.on('clean_end', (info) => {
      console.log(`Cleaned ${info.amount} files.`)
      mainWindow.webContents.send('game:clean_end', info)
    })

    launcher.on('launch_launch', (info) => {
      console.log(`Launching Minecraft ${info.version} (${info.type}${info.loaderVersion ? ` ${info.loaderVersion}` : ''})...`)
      mainWindow.webContents.send('game:launch_launch', info)
      if (settings.launcherAction === 'close') {
        setTimeout(() => app.quit(), 5000)
      } else if (settings.launcherAction === 'hide') {
        setTimeout(() => mainWindow.minimize(), 5000)
      }
      mainWindow.webContents.send('game:launched')
    })
    launcher.on('launch_data', (message) => {
      console.log(message)
      mainWindow.webContents.send('game:launch_data', message)
    })
    launcher.on('launch_close', (code) => {
      console.log(`Closed with code ${code}.`)
      mainWindow.webContents.send('game:launch_close', code)
    })

    launcher.on('launch_debug', (message) => {
      mainWindow.webContents.send('game:launch_debug', message)
    })
    launcher.on('patch_debug', (message) => {
      mainWindow.webContents.send('game:patch_debug', message)
    })

    try {
      launcher.launch()
    } catch (err) {
      console.error('Launcher error:', err)
    }
  })
}

