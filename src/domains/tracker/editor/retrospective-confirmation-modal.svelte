<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import Text from '../../../components/text/text.svelte'
  import { closeModal } from '../../../components/backdrop/BackdropStore2'

  interface Props {
    id: string
    calculated: { date: string; value: number }[]
    skipped: string[]
    onConfirm: () => void
    onCancel: () => void
  }

  const { id, calculated, skipped, onConfirm, onCancel } = $props<Props>()

  const handleCancel = () => {
    closeModal(id)
    onCancel()
  }

  const handleConfirm = () => {
    onConfirm()
    closeModal(id)
  }
</script>

<BackdropModal {id}>
  <header slot="header">
    <ToolbarGrid>
      <span class="animate line-clamp-1 up text-md ntitle">Review Calculated Values</span>
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4 overflow-y-auto">
    <!-- Summary -->
    <div class="flex gap-4">
      <Text size="sm" class="text-green-600 dark:text-green-400">
        <strong>{calculated.length}</strong> to calculate
      </Text>
      {#if skipped.length > 0}
        <Text size="sm" class="text-gray-600 dark:text-gray-400">
          <strong>{skipped.length}</strong> skipped (existing values)
        </Text>
      {/if}
    </div>

    <!-- Calculated values -->
    {#if calculated.length > 0}
      <div>
        <Text size="xs" class="font-semibold text-green-600 dark:text-green-400 mb-2">CALCULATED</Text>
        <div class="space-y-2">
          {#each calculated as result}
            <div class="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700/50">
              <Text size="sm" class="font-medium">{result.date}</Text>
              <Text size="sm" class="text-green-600 dark:text-green-400 font-semibold">
                {result.value.toFixed(2)}
              </Text>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Skipped values -->
    {#if skipped.length > 0}
      <div>
        <Text size="xs" class="font-semibold text-gray-600 dark:text-gray-400 mb-2">SKIPPED (existing values)</Text>
        <div class="space-y-2">
          {#each skipped as date}
            <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
              <Text size="sm" class="font-medium">{date}</Text>
              <Text size="sm" class="text-gray-500 dark:text-gray-400 italic">skipped</Text>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </main>

  <footer slot="footer" class="flex gap-2 justify-end p-4">
    <button
      on:click={handleCancel}
      class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      Cancel
    </button>
    <button
      on:click={handleConfirm}
      class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition font-medium"
    >
      Save {calculated.length} Values
    </button>
  </footer>
</BackdropModal>
