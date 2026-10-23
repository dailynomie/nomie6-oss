<svelte:options runes={true} />

<script lang="ts">
  // I2: the suggested note is shown for the user to check. Nothing is saved until "Save this note".
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { Lang } from '../../store/lang'
  import type { Suggestion } from './quick-suggest'

  const { id, suggestion, onConfirm } = $props<{
    id: string
    suggestion: Suggestion
    onConfirm: (note: string) => void | Promise<void>
  }>()

  let text = $state(suggestion.text)
  const found = $derived(
    suggestion.recognised.map((r) => (r.value !== undefined ? `${r.tag}(${r.value})` : r.tag)).join(', ')
  )

  const save = async () => {
    closeModal(id)
    await onConfirm(text.trim())
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>{Lang.t('capture.keep-my-words', 'Back')}</Button>
      </div>
      <h2 class="ntitle">{Lang.t('capture.suggest-title', 'Suggested note')}</h2>
      <div slot="right"></div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-ios-label">
    <p class="text-sm text-ios-label2">{Lang.t('capture.suggest-intro', 'Check the suggestion. Nothing is saved until you choose Save.')}</p>
    <p class="text-sm text-ios-label2">
      {found ? Lang.t('capture.recognised', { items: found }) : Lang.t('capture.nothing-recognised', 'No trackers or people were recognised.')}
    </p>
    <textarea class="w-full p-3 rounded-xl ios-card text-ios-label outline-none" rows="4" bind:value={text}></textarea>
    <Button block primary disabled={!text.trim()} on:click={save}>{Lang.t('capture.save-suggestion', 'Save this note')}</Button>
  </main>
</BackdropModal>
