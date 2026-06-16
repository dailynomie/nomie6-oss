<svelte:options runes={true} />

<script lang="ts">
  import { PluginStore } from '../PluginStore'
  import PluginFrame from '../plugin-frame.svelte'
  import PluginSetupModal from './plugin-setup-modal.svelte'
  import type { PluginClass } from '../plugin-helpers'
  import Layout from '../../layout/layout.svelte'

  let showSetupModal = $state(true)
  let plugin: PluginClass | undefined = $state(undefined)

  // Subscribe to PluginStore and update plugin reference
  let unsubscribe: any
  if (typeof window !== 'undefined') {
    unsubscribe = PluginStore.subscribe((plugins) => {
      const blockly = plugins.find(p => p.id === 'nomie-blockly') as PluginClass | undefined
      plugin = blockly

      // Hide modal when setup is complete
      if (blockly?.setupComplete) {
        showSetupModal = false
      }
    })
  }

  const handleSetupConfirm = async () => {
    if (plugin) {
      // Mark setup as complete and save to store
      plugin.setupComplete = true
      // The subscription callback will update showSetupModal when store changes
      await PluginStore.upsert(plugin)
    }
  }

  const handleSetupCancel = () => {
    // User cancels - don't show again this session but keep showing on page revisits
    // until they confirm
    showSetupModal = false
  }
</script>

<Layout pageTitle="Nomie Blockly">
  <!-- Always render the plugin in the background -->
  {#if plugin}
    <div class="plugin-container">
      <PluginFrame
        lid="blockly"
        openAction="onUIOpened"
        {plugin}
      />
    </div>
  {/if}

  <!-- Show setup modal on top if not yet enabled -->
  {#if showSetupModal && plugin && !plugin.setupComplete}
    <PluginSetupModal
      {plugin}
      on:confirm={handleSetupConfirm}
      on:cancel={handleSetupCancel}
    />
  {/if}
</Layout>

<style lang="postcss">
  .plugin-container {
    @apply w-full overflow-hidden;
    height: calc(100vh - 200px);
    min-height: 600px;
  }
</style>
