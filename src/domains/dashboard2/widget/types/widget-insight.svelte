<svelte:options runes={true} />

<script lang="ts">
  import { query } from '../../../ai/engine.svelte'
  import { Prefs } from '../../../preferences/Preferences'
  import { LedgerStore } from '../../../ledger/LedgerStore'
  import { getPromptText, getPromptLabel } from './widget-insight-prompts'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import type { WidgetClass } from '../widget-class'

  dayjs.extend(relativeTime)

  interface Props {
    widget: WidgetClass
  }

  const { widget } = $props<Props>()

  let insight = $state('')
  let loading = $state(false)
  let error = $state<string | null>(null)
  let lastFetchDate = $state<string | null>(null)
  let promptLabel = $state('')

  async function shouldFetchInsight(): Promise<boolean> {
    const today = dayjs().format('YYYY-MM-DD')

    // If cached insight exists and is from today, use it
    if (widget.data?.cachedInsight && widget.data?.cachedDate === today) {
      insight = widget.data.cachedInsight
      lastFetchDate = widget.data.cachedDate
      promptLabel = getPromptLabel(widget.data?.promptValue || 'Custom Prompt')
      return false
    }

    return true
  }

  async function fetchInsight() {
    if (!$Prefs.ai?.enabled) {
      error = 'AI is not enabled. Enable it in Settings.'
      return
    }

    if (!widget.data?.promptValue) {
      error = 'No prompt configured for this insight widget.'
      return
    }

    loading = true
    error = null

    try {
      // Get the prompt text
      const promptText = getPromptText(widget.data.promptValue)
      promptLabel = getPromptLabel(widget.data.promptValue)

      // Get logs for the timeframe
      const timeConfig = widget.timeConfig
      const logs = await LedgerStore.query({
        start: timeConfig.start.format('YYYY-MM-DD'),
        end: timeConfig.end.format('YYYY-MM-DD'),
      })

      if (!logs || logs.length === 0) {
        error = 'No data available for the selected timeframe.'
        loading = false
        return
      }

      // Query AI for insight
      const response = await query({
        profile: 'insight',
        prompt: promptText,
      })

      insight = response.content as string
      const today = dayjs().format('YYYY-MM-DD')

      // Update widget data with cache
      widget.data = widget.data || {}
      widget.data.cachedInsight = insight
      widget.data.cachedDate = today
      widget.data.cachedAt = Date.now()

      lastFetchDate = today
      loading = false
    } catch (e) {
      error = (e as Error).message || 'Failed to generate insight'
      loading = false
    }
  }

  $effect(() => {
    if (widget && $Prefs.ai?.enabled) {
      shouldFetchInsight().then((shouldFetch) => {
        if (shouldFetch) {
          fetchInsight()
        }
      })
    }
  })
</script>

<div class="insight-widget flex flex-col h-full justify-between">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="spinner mb-2"></div>
        <p class="text-xs text-gray-500">Generating insight...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-full">
      <div class="text-center px-4">
        <p class="text-xs text-red-500 font-semibold">{error}</p>
      </div>
    </div>
  {:else if insight}
    <div class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto px-2 py-2">
        <p class="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
          {insight}
        </p>
      </div>
      {#if lastFetchDate}
        <div class="text-xs text-gray-500 text-right px-2 py-1 border-t border-gray-200 dark:border-gray-700">
          {promptLabel} • {dayjs(lastFetchDate).fromNow()}
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex items-center justify-center h-full">
      <p class="text-xs text-gray-500">No insight available</p>
    </div>
  {/if}
</div>

<style lang="postcss">
  .insight-widget {
    font-size: 14px;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(99, 102, 241, 0.2);
    border-top-color: rgb(99, 102, 241);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
