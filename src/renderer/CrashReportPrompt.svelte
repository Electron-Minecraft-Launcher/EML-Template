<script lang="ts">
  import { onMount } from 'svelte'
  import { crashReports } from '../ipc'
  import { showDialog } from './stores'

  type CrashNotice = {
    id: string
    exitCode: number
    date: string
    profile: string
    minecraftVersion: string
  }

  const queue: CrashNotice[] = []
  let showingPrompt = false

  onMount(() => crashReports.onDetected((notice) => {
    queue.push(notice)
    void processQueue()
  }))

  async function processQueue() {
    if (showingPrompt) return
    showingPrompt = true

    try {
      while (queue.length) {
        const report = queue.shift()!
        const accepted = await showDialog<boolean>(
          `Minecraft closed unexpectedly (exit code ${report.exitCode}). Would you like to send an anonymized crash report?`,
          [
            { text: 'Do not send', type: 'cancel' },
            { text: 'Send report', type: 'ok' }
          ],
          'The game crashed'
        )

        if (!accepted) {
          await crashReports.dismiss(report.id)
          continue
        }

        let sent = false
        while (!sent) {
          const result = await crashReports.send(report.id)
          if (result.success) {
            sent = true
            await showDialog('The crash report was sent successfully.', [{ text: 'OK', type: 'ok' }], 'Report sent')
            continue
          }

          const retry = await showDialog<boolean>(
            `The crash report could not be sent. ${result.error ?? 'Please check your connection.'} Retry?`,
            [
              { text: 'Close', type: 'cancel' },
              { text: 'Retry', type: 'ok' }
            ],
            'Could not send report'
          )
          if (!retry) {
            await crashReports.dismiss(report.id)
            break
          }
        }
      }
    } finally {
      showingPrompt = false
      if (queue.length) void processQueue()
    }
  }
</script>
