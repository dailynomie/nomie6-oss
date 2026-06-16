<svelte:options runes={true} />

<script lang="ts">
  import { PluginStore } from '../domains/plugins/PluginStore'
  import PluginFrame from '../domains/plugins/plugin-frame.svelte'
  import PluginSetupModal from '../domains/plugins/blockly/plugin-setup-modal.svelte'
  import type { PluginClass } from '../domains/plugins/plugin-helpers'
  import Layout from '../domains/layout/layout.svelte'

  let showSetupModal = $state(true)
  let plugin: PluginClass | undefined = $state(undefined)
  let wrapperElement: HTMLDivElement | undefined = $state(undefined)

  // Subscribe to PluginStore and update plugin reference
  let unsubscribe: any
  if (typeof window !== 'undefined') {
    // First check immediately without waiting for subscription
    const currentPlugins = PluginStore.rawState()
    const blocklyImmediate = currentPlugins.find(p => p.id === 'nomie-blockly') as PluginClass | undefined
    if (blocklyImmediate) {
      plugin = blocklyImmediate
      showSetupModal = !blocklyImmediate.setupComplete
    }

    unsubscribe = PluginStore.subscribe((plugins) => {
      const blockly = plugins.find(p => p.id === 'nomie-blockly') as PluginClass | undefined

      // Update when plugin is found
      if (blockly) {
        plugin = blockly
        showSetupModal = !blockly.setupComplete
      }
    })
  }

  // Adjust height to account for footer position
  $effect(() => {
    if (wrapperElement && typeof window !== 'undefined') {
      const updateHeight = () => {
        const footer = document.querySelector('footer.layout-footer')
        if (footer && wrapperElement) {
          const footerRect = footer.getBoundingClientRect()
          const wrapperRect = wrapperElement.getBoundingClientRect()
          // Set height to reach just above the footer
          const newHeight = footerRect.top - wrapperRect.top
          wrapperElement.style.height = `${Math.max(newHeight, 400)}px`
        }
      }

      // Update immediately and on resize
      updateHeight()
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  })

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
    <div class="plugin-wrapper" bind:this={wrapperElement}>
      <div class="plugin-container">
        <PluginFrame
          lid="blockly"
          openAction="onUIOpened"
          {plugin}
        />
      </div>
    </div>
  {/if}

  <!-- Show setup modal on top if not yet enabled -->
  {#if showSetupModal && plugin && !plugin.setupComplete}
    <div class="modal-overlay">
      <PluginSetupModal
        {plugin}
        on:confirm={handleSetupConfirm}
        on:cancel={handleSetupCancel}
      />
    </div>
  {/if}
</Layout>

<style lang="postcss">
  .plugin-wrapper {
    @apply w-full overflow-hidden;
  }

  .plugin-container {
    @apply w-full h-full overflow-hidden;
  }

  .modal-overlay {
    @apply fixed inset-0 z-50;
  }
</style>
