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

  const { widget = $bindable() } = $props()

  console.log('[Insight Widget] Component loaded, widget:', widget)

  // Set to true to use mock/dummy responses instead of real Claude API
  // Useful for testing without spending credits
  const USE_MOCK_MODE = true

  let insight = $state('')
  let loading = $state(false)
  let error = $state<string | null>(null)
  let lastFetchDate = $state<string | null>(null)
  let promptLabel = $state('')

  const mockResponses: Record<string, string> = {
    patterns: 'Based on your tracking data, I notice three key patterns: (1) Your productivity peaks on Tuesday and Wednesday mornings, (2) Your mood is notably higher on days when you exercise, (3) You tend to log entries more consistently in the evening. These patterns suggest optimizing your schedule around your natural peak times.',
    progress: 'You\'re making solid progress towards your goals! This week you completed 85% of your daily targets, up from 72% last week. Your consistency has improved by 18% over the last month. Focus on maintaining momentum during weekends when adherence typically drops.',
    insights: 'Your data reveals interesting insights: (1) You have a 23% higher completion rate for goals set in the morning vs evening, (2) Your average metric values show 15% improvement over the last 30 days, (3) External factors like weather appear to influence your outdoor activity tracking. Leverage these insights for better planning.',
    recommendations: 'Here are 3 actionable recommendations: (1) Schedule important tasks during your identified peak performance hours (Tuesday-Wednesday morning), (2) Plan exercise sessions right before important work blocks since they boost productivity, (3) Set up weekend reminders since compliance drops by 12% on Saturdays and Sundays.',
    trends: 'Your trends over the past 30 days show: (1) Steady upward trajectory in goal completion (from 65% to 85%), (2) More consistent tracking with fewer gaps between entries, (3) Slight seasonal pattern emerging - certain activities peak on specific days. This positive momentum suggests your systems are working well.',
    wellbeing: 'Your overall wellbeing assessment is positive! Key indicators show: (1) Sleep quality and mood are correlated positively, (2) Your stress levels have decreased by 22% since you started tracking, (3) Social interactions appear to be a strong predictor of daily satisfaction. Prioritize these wellbeing drivers.',
    productivity: 'Your productivity trends are encouraging: (1) Morning focus sessions yield 40% more output than afternoon sessions, (2) You\'re most productive after rest days, (3) Task switching costs you approximately 25 minutes of productive time. Batch similar tasks together for better flow.',
    health: 'Health-related insights from your data: (1) Your exercise frequency correlates with better sleep quality, (2) You show consistent hydration patterns, (3) Your recovery metrics improve significantly on rest days. Maintaining this exercise routine is your strongest health lever.',
    mood: 'Mood pattern analysis shows: (1) Your mood is 30% higher on days with social interaction, (2) Morning mood fluctuates more than evening mood, (3) Certain activities consistently elevate your mood - prioritize these in your weekly planning. Your emotional patterns are quite stable overall.',
    correlation: 'Strong correlations detected: (1) Exercise ↔ Sleep Quality (r=0.78), (2) Social Time ↔ Mood (r=0.72), (3) Stress Level ↔ Productivity (r=-0.65 inverse). These relationships suggest focusing on exercise and social connection will have cascading positive effects on other areas.',
  }

  function getMockResponse(promptKey: string): string {
    return mockResponses[promptKey] || mockResponses.insights
  }

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
    // Skip AI enabled check in mock mode
    if (!USE_MOCK_MODE && !$Prefs.ai?.enabled) {
      error = 'AI is not enabled. Enable it in Settings.'
      console.log('[Insight Widget]', error)
      return
    }

    if (!widget.data?.promptValue) {
      error = 'No prompt configured for this insight widget.'
      console.log('[Insight Widget]', error)
      return
    }

    loading = true
    error = null

    try {
      // Get the prompt text
      const promptText = getPromptText(widget.data.promptValue)
      promptLabel = getPromptLabel(widget.data.promptValue)
      console.log('[Insight Widget] Fetching insight with prompt:', promptText)

      // Get logs for the timeframe
      const timeframe = widget.timeframe
      console.log('[Insight Widget] Timeframe:', timeframe)
      const logs = await LedgerStore.query({
        start: timeframe.start.format('YYYY-MM-DD'),
        end: timeframe.end.format('YYYY-MM-DD'),
      })

      console.log('[Insight Widget] Found logs:', logs?.length)
      if (!logs || logs.length === 0) {
        error = 'No data available for the selected timeframe.'
        console.log('[Insight Widget]', error)
        loading = false
        return
      }

      // Query AI for insight (or use mock if in test mode)
      let insightContent: string
      if (USE_MOCK_MODE) {
        console.log('[Insight Widget] USING MOCK MODE - not calling Claude API')
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
        insightContent = getMockResponse(widget.data.promptValue)
        console.log('[Insight Widget] Got mock response')
      } else {
        console.log('[Insight Widget] Querying Claude...')
        const response = await query({
          profile: 'insight',
          prompt: promptText,
        })
        console.log('[Insight Widget] Got response:', response)
        insightContent = response.content as string
      }

      insight = insightContent
      const today = dayjs().format('YYYY-MM-DD')

      // Update widget data with cache
      widget.data = widget.data || {}
      widget.data.cachedInsight = insight
      widget.data.cachedDate = today
      widget.data.cachedAt = Date.now()

      lastFetchDate = today
      loading = false
      console.log('[Insight Widget] Cached insight successfully')
    } catch (e) {
      error = (e as Error).message || 'Failed to generate insight'
      console.error('[Insight Widget] Error:', e)
      loading = false
    }
  }

  $effect(() => {
    console.log('[Insight Widget] Effect running')
    console.log('[Insight Widget]   Prefs:', $Prefs)
    console.log('[Insight Widget]   Prefs.ai:', $Prefs.ai)
    console.log('[Insight Widget]   ai.enabled:', $Prefs.ai?.enabled)
    console.log('[Insight Widget]   widget:', !!widget)
    console.log('[Insight Widget]   promptValue:', widget?.data?.promptValue)

    // For testing, we'll proceed even if AI isn't technically "enabled"
    // because we're using mock mode
    if (widget && widget?.data?.promptValue) {
      shouldFetchInsight().then((shouldFetch) => {
        console.log('[Insight Widget] Should fetch:', shouldFetch)
        if (shouldFetch) {
          fetchInsight()
        }
      })
    } else {
      console.log('[Insight Widget] Missing widget or promptValue, skipping fetch')
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
