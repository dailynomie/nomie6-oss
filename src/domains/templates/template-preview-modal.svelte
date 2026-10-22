<svelte:options runes={true} />

<script lang="ts">
  import type { Template } from './templates-utils'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import Button from '../../components/button/button.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'

  import TemplateView from './template-view.svelte'

  const close = () => {
    closeModal(id)
  }

  let { id, template = $bindable() } = $props()
</script>

<BackdropModal className="h-full" mainClass="bg-ios-bg">
  <ToolbarGrid slot="header">
    <Button slot="right" primary clear on:click={() => close()}>Done</Button>
  </ToolbarGrid>
  <main class="lg:p-6 p-4">
    <TemplateView bind:template />
  </main>
</BackdropModal>
