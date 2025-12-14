import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'

export default defineConfig({
  base: './',
  plugins: [
    electron([
      {
        entry: 'electron/main.ts'
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        }
      }
    ])
  ]
})
