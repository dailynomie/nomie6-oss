<svelte:options runes={true} />

<script lang="ts">
  import type { WidgetClass } from '../widget-class'
  import { showToast } from '../../../../components/toast/ToastStore'
  import { insightClearSignal } from './insightClearSignal'
  import { insightModalData } from './insightModalStore'
  import { openModal } from '../../../../components/backdrop/BackdropStore2'
  import { query } from '../../../ai/engine.svelte'
  import { timeFrames } from '../widget-timeframe'
  import * as marked from 'marked'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { getPromptLabel } from './widget-insight-prompts'
  import WidgetInsightModal from './widget-insight-modal.svelte'

  dayjs.extend(relativeTime)

  const { widget } = $props<{ widget: WidgetClass }>()

  let insight = $state<string>('')
  let isLoading = $state(false)
  let promptLabel = $state('')
  let renderedInsight = $derived(insight ? marked.parse(insight) : '')
  let lastFetchDate = $state<string>('')

  function getWidgetDateRange() {
    const timeframe = timeFrames.find(tf => tf.id === widget.timeRange)
    if (!timeframe) {
      return {
        from: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
        to: dayjs().format('YYYY-MM-DD')
      }
    }

    let start = dayjs()
    let end = dayjs()

    if (timeframe.start) {
      if (timeframe.start.subtract) {
        start = start.subtract(timeframe.start.subtract[0], timeframe.start.subtract[1] as any)
      }
      if (timeframe.start.startOf) {
        start = start.startOf(timeframe.start.startOf as any)
      }
    }

    if (timeframe.end) {
      if (timeframe.end.subtract) {
        end = end.subtract(timeframe.end.subtract[0], timeframe.end.subtract[1] as any)
      }
      if (timeframe.end.endOf) {
        end = end.endOf(timeframe.end.endOf as any)
      }
    }

    return {
      from: start.format('YYYY-MM-DD'),
      to: end.format('YYYY-MM-DD')
    }
  }

  async function fetchInsight() {
    isLoading = true
    try {
      const dateRange = getWidgetDateRange()
      console.log(`[Insight Widget] Fetching with timeframe "${widget.timeRange}":`, dateRange)

      const result = await query({
        profile: 'insight',
        contextHints: { dateRange }
      })

      if (result.content) {
        insight = result.content
        promptLabel = getPromptLabel('insight')
        lastFetchDate = dayjs().format('YYYY-MM-DD')

        // Cache the insight in widget data
        widget.data = widget.data || {}
        widget.data.cachedInsight = insight
        widget.data.cachedDate = lastFetchDate
        widget.data.cachedAt = new Date().toISOString()
        widget.data.promptLabel = promptLabel

        console.log('[Insight Widget] Cached insight, will refresh tomorrow')
      } else {
        insight = result.raw || 'Failed to generate insight'
        promptLabel = 'Error'
      }
    } catch (e: any) {
      console.error('[Insight Widget] Error:', e)
      insight = e.message || 'Failed to generate insight'
      promptLabel = 'Error'
    } finally {
      isLoading = false
    }
  }

  function getRefreshTime(): string {
    if (!lastFetchDate) return 'N/A'
    const today = dayjs().format('YYYY-MM-DD')
    if (lastFetchDate === today) {
      const tomorrow = dayjs().add(1, 'day').startOf('day')
      const hoursUntilRefresh = tomorrow.diff(dayjs(), 'hour')
      return `${hoursUntilRefresh}h`
    }
    return 'Soon'
  }

  function openInsightModal() {
    insightModalData.set({
      id: widget.id || '',
      insight,
      promptLabel,
      lastFetchDate,
    })
    openModal(WidgetInsightModal, 'insight-modal')
  }

  $effect(() => {
    // Subscribe to clear signal
    const unsubscribe = insightClearSignal.subscribe((signal) => {
      if (signal.trigger) {
        console.log('[Insight Widget] Clear signal received, fetching new insight')
        insight = ''
        lastFetchDate = ''
        fetchInsight()
      }
    })
    return unsubscribe
  })

  $effect(() => {
    // Load cached insight if available
    if (widget?.data?.cachedInsight) {
      insight = widget.data.cachedInsight
      lastFetchDate = widget.data.cachedDate || ''
      promptLabel = widget.data.promptLabel || 'Insight'

      // Check if cache is still valid (same day)
      const today = dayjs().format('YYYY-MM-DD')
      const shouldFetch = lastFetchDate !== today

      console.log(`[Insight Widget] Loaded cached insight. Cache date: ${lastFetchDate}, Today: ${today}, Should fetch: ${shouldFetch}`)

      if (shouldFetch) {
        fetchInsight()
      }
    } else {
      console.log('[Insight Widget] No cached insight, fetching...')
      fetchInsight()
    }
  })
</script>

<div class="insight-container h-24 overflow-y-auto p-3 flex flex-col">
  {#if isLoading}
    <div class="text-xs text-gray-500 italic">Loading insight...</div>
  {:else if insight}
    <div
      class="text-xs leading-relaxed italic markdown-content line-clamp-4 cursor-pointer flex-1"
      on:click={openInsightModal}
    >
      {@html renderedInsight}
    </div>
  {:else}
    <div class="text-xs text-gray-500 italic">No insight available</div>
  {/if}

  <footer class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 gap-2">
    {#if promptLabel}
      <span class="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
        {promptLabel}
      </span>
    {/if}
    <div class="flex-1" />
    {#if lastFetchDate}
      <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
        {getRefreshTime()}
      </span>
    {/if}
  </footer>
</div>

<style lang="postcss" global>
  .markdown-content p {
    margin: 0;
  }
  .markdown-content strong {
    font-weight: 600;
  }
  .markdown-content em {
    font-style: italic;
  }
  .markdown-content ul,
  .markdown-content ol {
    margin: 0;
    padding-left: 1rem;
  }
  .markdown-content li {
    margin: 0;
  }
</style>
