<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import Button from '../../components/button/button.svelte'
  import Title from '../../components/title/title.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import { wait } from '../../utils/tick/tick'
  import PluginInstaller from './plugin-installer.svelte'
  import { closePluginInstaller } from './PluginStore'


  const { id, url } = $props()
</script>

<BackdropModal mainClass="px-4 py-4">
  <ToolbarGrid slot="header">
    <Title>Install a Plugin</Title>
    <Button
      slot="right"
      clear
      primary
      on:click={() => {
        wait(10).then(() => {
          closeModal(id)
        })
      }}>{Lang.t('general.done', 'Done')}</Button
    >
  </ToolbarGrid>
  <PluginInstaller
    {url}
    on:cancel={() => {
      closePluginInstaller()
    }}
    on:installed={() => {
      closePluginInstaller()
    }}
  />

  <p class="text-description text-xs text-center mt-4">
    Plugins are externally hosted websites that can communicate back and forth with Nomie. Plugins are responsible for
    their own privacy policy.
  </p>
  {#if url}<p class="text-xs text-ios-label mt-2 text-center">Source: {new URL(url).origin}</p>{/if}
  <!-- iOS look (D-caution): a caution is neutral secondary text with a warning glyph; red is only for destructive actions -->
  <p class="text-sm font-semibold text-ios-label2 mt-3 text-center">⚠︎ Only install plugins from sources that you trust.</p>
</BackdropModal>
