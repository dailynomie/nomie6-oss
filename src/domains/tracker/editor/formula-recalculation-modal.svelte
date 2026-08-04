<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import Text from '../../../components/text/text.svelte'
  import Button from '../../../components/button/button.svelte'
  import List from '../../../components/list/list.svelte'
  import ListItem from '../../../components/list-item/list-item.svelte'
  import NInput from '../../../components/input/input.svelte'
  import { closeModal } from '../../../components/backdrop/BackdropStore2'

  interface Props {
    id: string
    trackerTag: string
    onConfirm: (days: number) => void
    onCancel: () => void
  }

  let days = $state(7)
  const { id, trackerTag, onConfirm, onCancel } = $props<Props>()

  const handleCancel = () => {
    closeModal(id)
    onCancel()
  }

  const handleConfirm = () => {
    onConfirm(days)
    closeModal(id)
  }
</script>

<BackdropModal {id}>
  <header slot="header">
    <ToolbarGrid>
      <span class="animate line-clamp-1 up text-md ntitle">Recalculate Historical Values</span>
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4">
    <div class="space-y-3">
      <Text className="text-gray-800 dark:text-gray-200">
        You've changed the formula for <strong>#{trackerTag}</strong>. Would you like to recalculate
        historical values with the new formula?
      </Text>

      <div class="info-box rounded p-3 space-y-2">
        <Text size="sm" className="text-blue-900 dark:text-white">
          ℹ️ This will update existing log entries by replacing the old values with newly calculated
          values using your new formula.
        </Text>
      </div>

      <List solo>
        <NInput
          listItem
          type="number"
          min="1"
          max="365"
          bind:value={days}
          label="Days to recalculate (max 365)"
        />
      </List>
      <Text size="xs" className="text-gray-700 dark:text-gray-300">
        Starting from yesterday, going back {days} days
      </Text>
    </div>
  </main>

  <footer slot="footer" class="flex gap-2 justify-end p-4">
    <Button on:click={handleCancel} clear>
      Skip
    </Button>
    <Button on:click={handleConfirm} primary>
      Recalculate {days} Days
    </Button>
  </footer>
</BackdropModal>

<style lang="postcss">
  :global(.info-box) {
    background-color: #eff6ff;
  }

  :global(.dark .info-box),
  :global([data-theme="dark"] .info-box) {
    background-color: #0c2940;
  }
</style>
