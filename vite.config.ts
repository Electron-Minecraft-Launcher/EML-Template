import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: './',
  server: {
    port: 5174
  },
  plugins: [
    svelte({ preprocess: vitePreprocess(), compilerOptions: { runes: true } }),
    electron([
      {
        entry: 'electron/main.ts'
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            emptyOutDir: false
          }
        },
        onstart(options) {
          options.reload()
        }
      }
    ])
  ]
})

