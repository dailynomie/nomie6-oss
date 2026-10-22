<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import Button from '../../../components/button/button.svelte'
  import type { PluginClass } from '../plugin-helpers'

  const { plugin } = $props<{ plugin: PluginClass }>()

  const dispatch = createEventDispatcher()

  const handleConfirm = () => {
    dispatch('confirm')
  }

  const handleCancel = () => {
    dispatch('cancel')
  }
</script>

<BackdropModal mainClass="bg-ios-bg">
  <div class="setup-content">
    <div class="plugin-icon">
      {plugin.emoji}
    </div>

    <h2 class="plugin-name">
      {plugin.name}
    </h2>

    <p class="confirmation-text">Enable this plugin?</p>

    <div class="button-group">
      <Button outline primary on:click={handleCancel}>Cancel</Button>
      <Button primary on:click={handleConfirm}>Enable</Button>
    </div>
  </div>
</BackdropModal>

<style lang="postcss">
  .setup-content {
    @apply flex flex-col items-center justify-center p-8 gap-4;
    min-width: 300px;
  }

  .plugin-icon {
    @apply text-6xl;
  }

  .plugin-name {
    @apply text-2xl font-bold text-center text-ios-label;
  }

  .confirmation-text {
    @apply text-center text-ios-label2 mb-4;
  }

  .button-group {
    @apply flex gap-3 w-full;
  }

  :global(.setup-content button) {
    @apply flex-1;
  }
</style>
