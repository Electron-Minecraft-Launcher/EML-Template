import { app } from 'electron'
import { EventEmitter } from 'node:events'
import { Stats } from 'eml-lib'
import type { IStatProvider, StatProvider } from 'eml-lib'
import logger from 'electron-log/main'
import { ADMINTOOL_URL } from '../const'

export type StatsIntegration = {
  stats: Stats
  attach: (provider: IStatProvider) => void
}

class StatsProviderBridge extends EventEmitter implements IStatProvider {
  constructor(readonly statType: StatProvider) {
    super()
  }
}

export function registerStatsHandlers(): StatsIntegration {
  const stats = new Stats(ADMINTOOL_URL, app.getVersion())
  const ready = stats.initialize().catch((error) => {
    logger.error('Could not initialize launcher statistics:', error)
  })
  const attachedProviders = new WeakSet<object>()

  return {
    stats,
    attach(provider) {
      if (attachedProviders.has(provider)) return
      attachedProviders.add(provider)

      const eventsByProvider: Partial<Record<StatProvider, string>> = {
        AUTH_MICROSOFT: 'auth_success',
        AUTH_YGGDRASIL: 'auth_success',
        AUTH_AZAUTH: 'auth_success',
        AUTH_CRACK: 'auth_success',
        LAUNCHER: 'launch_launch',
        BOOTSTRAP: 'bootstrap_update'
      }
      const eventName = eventsByProvider[provider.statType]
      if (!eventName) return

      const bridge = new StatsProviderBridge(provider.statType)
      const observableProvider = provider as IStatProvider & {
        on: (event: string, listener: (...args: any[]) => void) => unknown
      }
      const queuedEvents: unknown[][] = []
      let initialized = false

      observableProvider.on(eventName, (...args: unknown[]) => {
        if (initialized) bridge.emit(eventName, ...args)
        else queuedEvents.push(args)
      })

      void ready.then(() => {
        try {
          stats.attach(bridge)
          initialized = true
          for (const args of queuedEvents) bridge.emit(eventName, ...args)
          queuedEvents.length = 0
        } catch (error) {
          logger.error('Could not attach a statistics provider:', error)
        }
      })
    }
  }
}
