import { ipcMain } from 'electron'
import { News } from 'eml-lib'
import type { INews} from 'eml-lib'

export function registerNewsHandlers() {
  ipcMain.handle('news:get_news', async () => {
    try {
      const news = new News('http://localhost:8080')
      const feed = (await news.getNews()) as INews[]
      return feed
    } catch (err) {
      console.error('Failed to fetch news:', err)
      return []
    }
  })

  ipcMain.handle('news:get_categories', async () => {
    try {
      const news = new News('http://localhost:8080')
      const feed = await news.getCategories()
      return feed
    } catch (err) {
      console.error('Failed to fetch news:', err)
      return []
    }
  })
}

