import { app, BrowserWindow } from 'electron'
import EMLLib from 'eml-lib'
import path from 'node:path'

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'My Launcher',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // For testing purposes only
    }
  })

  // Load Vite Dev Server URL in development
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  createWindow()

  console.log('Starting Minecraft via EML...')

  // 1. Initialize the Launcher
  const launcher = new EMLLib.Launcher({
    url: 'http://localhost:8080', // Your AdminTool URL
    serverId: 'template', // Your server ID
    account: new EMLLib.CrackAuth().auth('TestAccount') // A test cracked account
  })

  // 2. Attach listeners
  launcher.on('launch_compute_download', () => console.log('Computing download...'))
  launcher.on('launch_download', (download) => console.log(`Downloading ${download.total.amount} files (${download.total.size} B).`))
  launcher.on('launch_install_loader', (loader) => console.log(`Installing loader ${loader.type} ${loader.loaderVersion}...`))
  launcher.on('launch_extract_natives', () => console.log('Extracting natives...'))
  launcher.on('launch_copy_assets', () => console.log('Copying assets...'))
  launcher.on('launch_patch_loader', () => console.log('Patching loader...'))
  launcher.on('launch_check_java', () => console.log('Checking Java...'))
  launcher.on('java_info', (info) => console.log(`Using Java ${info.version} ${info.arch}`))
  launcher.on('launch_clean', () => console.log('\nCleaning game directory...'))
  launcher.on('launch_launch', (info) => console.log(`Launching Minecraft ${info.version}...`))
  launcher.on('launch_data', (message) => console.log(message))
  launcher.on('launch_close', (code) => console.log(`Closed with code ${code}.`))

  try {
    await launcher.launch()
  } catch (err) {
    console.error('Error:', err)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
