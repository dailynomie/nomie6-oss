<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../../../components/backdrop/BackdropStore2'
  import { insightModalData } from './insightModalStore'
  import { marked } from 'marked'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'

  dayjs.extend(relativeTime)

  let modalId = $derived($insightModalData.id)
  let insight = $derived($insightModalData.insight)
  let promptLabel = $derived($insightModalData.promptLabel)
  let lastFetchDate = $derived($insightModalData.lastFetchDate)
  let renderedInsight = $derived(insight ? marked.parse(insight) : '')

  function getRefreshTime(): string {
    if (!lastFetchDate) return 'N/A'
    const today = dayjs().format('YYYY-MM-DD')
    if (lastFetchDate === today) {
      const tomorrow = dayjs().add(1, 'day').startOf('day')
      const hoursUntilRefresh = tomorrow.diff(dayjs(), 'hour')
      return `${hoursUntilRefresh} hour${hoursUntilRefresh !== 1 ? 's' : ''}`
    }
    return 'Soon'
  }

  function close() {
    if (modalId) {
      closeModal(modalId)
    }
  }
</script>

<style lang="postcss" global>
  .markdown-content p {
    margin: 0.5rem 0;
  }

  .markdown-content strong {
    font-weight: 600;
  }

  .markdown-content em {
    font-style: italic;
  }

  .markdown-content ul,
  .markdown-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .markdown-content li {
    margin: 0.25rem 0;
  }

  .markdown-content code {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }

  @media (prefers-color-scheme: dark) {
    .markdown-content code {
      background: rgba(255, 255, 255, 0.1);
    }
  }
</style>

<BackdropModal mainClass="bg-white dark:bg-gray-900">
  <div slot="header" class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
    <button
      onclick={close}
      class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 font-medium transition"
    >
      Close
    </button>
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Nomie Insights</h2>
    <div class="w-12" />
  </div>
  <div class="p-6 max-h-96 overflow-y-auto border border-sky-400 dark:border-sky-500 m-4 rounded">
    <div class="text-sm leading-relaxed text-gray-900 dark:text-gray-100 markdown-content">
      {@html renderedInsight}
    </div>
    {#if lastFetchDate}
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-4">
        Will refresh in {getRefreshTime()}
      </p>
    {/if}
  </div>
</BackdropModal>

