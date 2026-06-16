<svelte:options runes={true} />

<script lang="ts">
  import { PluginStore } from '../PluginStore'
  import PluginFrame from '../plugin-frame.svelte'
  import PluginSetupModal from './plugin-setup-modal.svelte'
  import type { PluginClass } from '../plugin-helpers'

  let showSetupModal = $state(true)
  let plugin: PluginClass | undefined = $state(undefined)

  // Get plugin from store and determine if setup is needed
  $effect(() => {
    const allPlugins = PluginStore.rawState()
    plugin = allPlugins.find(p => p.id === 'nomie-blockly') as PluginClass | undefined

    // Show setup modal only if plugin exists and setup not complete
    if (plugin && !plugin.setupComplete) {
      showSetupModal = true
    } else {
      showSetupModal = false
    }
  })

  const handleSetupConfirm = () => {
    if (plugin) {
      // Mark setup as complete
      plugin.setupComplete = true
      // Update in store (triggers persistence to plugins.json)
      PluginStore.upsert(plugin)
      showSetupModal = false
    }
  }

  const handleSetupCancel = () => {
    // User cancels - don't show again this session but keep showing on page revisits
    // until they confirm
    showSetupModal = false
  }
</script>

<div class="blockly-page">
  {#if showSetupModal && plugin}
    <PluginSetupModal
      {plugin}
      on:confirm={handleSetupConfirm}
      on:cancel={handleSetupCancel}
    />
  {/if}

  {#if plugin && plugin.setupComplete}
    <div class="plugin-container">
      <PluginFrame
        lid="blockly"
        openAction="onUIOpened"
        {plugin}
      />
    </div>
  {/if}
</div>

<style lang="postcss">
  .blockly-page {
    @apply w-screen h-screen overflow-hidden;
    background: var(--color-bg-primary);
  }

  .plugin-container {
    @apply w-full h-full;
  }

  :global(.blockly-page iframe) {
    @apply w-full h-full border-0;
  }
</style>
