import { ipcMain } from 'electron'
import { News } from 'eml-lib'
import type { INews, INewsCategory, INewsTag } from 'eml-lib'

export type FormattedNews = INews & {
  tags: INewsTag[]
  categories: INewsCategory[]
  author: { id: string; username: string }
}

export function registerNewsHandlers() {
  ipcMain.handle('news:get-news', async (_event, url: string) => {
    try {
      const news = new News('http://localhost:5173')
      const feed = (await news.getNews()) as FormattedNews[]
      return feed
    } catch (err) {
      console.error('Failed to fetch news:', err)
      return []
    }
  })

  ipcMain.handle('news:get-categories', async (_event, url: string) => {
    try {
      const news = new News(url)
      const feed = await news.getCategories()
      return feed
    } catch (err) {
      console.error('Failed to fetch news:', err)
      return []
    }
  })
}
