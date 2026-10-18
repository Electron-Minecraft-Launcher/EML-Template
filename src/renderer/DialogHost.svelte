<script lang="ts">
  import { dialog, resolveDialog } from './stores'
</script>

{#if $dialog}
  <div
    class="dialog-overlay"
    role="presentation"
    onclick={(event) => event.target === event.currentTarget && resolveDialog({ text: 'Cancel', type: 'cancel' })}
  >
    <div
      class="dialog-box"
      role="dialog"
      aria-modal="true"
      aria-label={$dialog.title ?? 'Notification'}
      aria-labelledby={$dialog.title ? 'dialog-title' : undefined}
      tabindex="-1"
    >
      {#if $dialog.title}<h3 id="dialog-title">{$dialog.title}</h3>{/if}
      <p>{$dialog.message}</p>
      <div class="dialog-actions">
        {#each $dialog.buttons as button (button.text)}
          <button
            class="btn"
            class:btn-danger={button.type === 'danger'}
            class:btn-secondary={button.type !== 'danger'}
            onclick={() => resolveDialog(button)}>{button.text}</button
          >
        {/each}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '../static/styles/dialog.scss' as *;
</style>
