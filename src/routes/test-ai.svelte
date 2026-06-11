<svelte:options runes={true} />

<script lang="ts">
  import NLayout from '../domains/layout/layout.svelte'
  import NBackButton from '../components/back-button/back-button.svelte'
  import { query, streamQuery, aiState } from '../domains/ai/engine.svelte'
  import type {
    AdviceItem,
    ChartDataset,
    JournalPrompt,
    AlertItem
  } from '../domains/ai/profiles/types'

  let responseText = $state('')
  let activeProfile = $state<'insight' | 'data' | 'advice' | 'journal' | 'alert'>(
    'insight'
  )
  let useStreaming = $state(false)

  async function testInsight() {
    responseText = 'Loading...'
    try {
      if (useStreaming) {
        responseText = ''
        await streamQuery(
          {
            profile: 'insight',
            prompt: 'How am I doing overall based on my data?',
            contextHints: { metrics: ['sleep', 'mood', 'steps'] }
          },
          (chunk) => {
            responseText += chunk
          }
        )
      } else {
        const res = await query<string>({
          profile: 'insight',
          prompt: 'How am I doing overall based on my data?',
          contextHints: { metrics: ['sleep', 'mood', 'steps'] }
        })
        responseText = res.content
      }
    } catch (err) {
      responseText = `Error: ${(err as Error).message}`
    }
  }

  async function testAdvice() {
    responseText = 'Loading...'
    try {
      const res = await query<AdviceItem[]>({
        profile: 'advice',
        prompt: 'What actionable advice do you have for me this week?',
        contextHints: {
          metrics: ['sleep', 'steps', 'mood'],
          dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }
        }
      })
      responseText = JSON.stringify(res.content, null, 2)
    } catch (err) {
      responseText = `Error: ${(err as Error).message}`
    }
  }

  async function testData() {
    responseText = 'Loading...'
    try {
      const res = await query<ChartDataset>({
        profile: 'data',
        prompt: 'Create a chart showing my sleep quality over the last week',
        contextHints: {
          metrics: ['sleep'],
          dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }
        }
      })
      responseText = JSON.stringify(res.content, null, 2)
    } catch (err) {
      responseText = `Error: ${(err as Error).message}`
    }
  }

  async function testJournal() {
    responseText = 'Loading...'
    try {
      const res = await query<JournalPrompt>({
        profile: 'journal',
        prompt: 'Generate reflection prompts for today',
        contextHints: { metrics: ['sleep', 'mood', 'steps'] }
      })
      responseText = JSON.stringify(res.content, null, 2)
    } catch (err) {
      responseText = `Error: ${(err as Error).message}`
    }
  }

  async function testAlert() {
    responseText = 'Loading...'
    try {
      const res = await query<AlertItem[]>({
        profile: 'alert',
        prompt: 'Detect any anomalies in my tracking data',
        contextHints: {
          metrics: ['sleep', 'steps', 'mood', 'hrv'],
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }
        }
      })
      responseText = JSON.stringify(res.content, null, 2)
    } catch (err) {
      responseText = `Error: ${(err as Error).message}`
    }
  }
</script>

<NLayout pageTitle="AI Integration Test" showTabs={false}>
  <div slot="header" class="n-toolbar-grid">
    <div class="left">
      <NBackButton />
    </div>
    <div class="main title">🤖 AI Test</div>
    <div class="right" />
  </div>

  <div slot="content" class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">AI Integration Test</h1>

  {#if $aiState.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {$aiState.error}
    </div>
  {/if}

  <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
    <p class="text-sm text-blue-800">
      <strong>Tip:</strong> Make sure you've configured your API key in Settings > AI Integration
      first!
    </p>
  </div>

  <div class="mb-6">
    <label class="flex items-center gap-2 mb-4">
      <input type="checkbox" bind:checked={useStreaming} />
      <span>Use Streaming (for insight profile only)</span>
    </label>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        onclick={testInsight}
        disabled={$aiState.loading}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {$aiState.loading ? 'Loading...' : '💬 Insight'}
      </button>

      <button
        onclick={testAdvice}
        disabled={$aiState.loading}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {$aiState.loading ? 'Loading...' : '💡 Advice'}
      </button>

      <button
        onclick={testData}
        disabled={$aiState.loading}
        class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
      >
        {$aiState.loading ? 'Loading...' : '📊 Data'}
      </button>

      <button
        onclick={testJournal}
        disabled={$aiState.loading}
        class="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-gray-400"
      >
        {$aiState.loading ? 'Loading...' : '📝 Journal'}
      </button>

      <button
        onclick={testAlert}
        disabled={$aiState.loading}
        class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
      >
        {$aiState.loading ? 'Loading...' : '⚠️ Alert'}
      </button>
    </div>
  </div>

  <div class="mb-4">
    <h2 class="text-lg font-semibold mb-2">Response:</h2>
    <div class="bg-gray-100 rounded p-4 font-mono text-sm min-h-32 max-h-96 overflow-auto">
      {#if $aiState.loading}
        <span class="text-gray-500">Processing...</span>
      {:else if responseText}
        <pre>{responseText}</pre>
      {:else}
        <span class="text-gray-500">Click a button above to test an AI profile</span>
      {/if}
    </div>
  </div>

  <div class="text-sm text-gray-600">
    <h3 class="font-semibold mb-2">Profiles:</h3>
    <ul class="space-y-1">
      <li>💬 <strong>Insight:</strong> Natural language conversation (supports streaming)</li>
      <li>💡 <strong>Advice:</strong> Actionable recommendations (structured array)</li>
      <li>📊 <strong>Data:</strong> Chart datasets (structured for visualization)</li>
      <li>📝 <strong>Journal:</strong> Reflection prompts (structured prompts)</li>
      <li>⚠️ <strong>Alert:</strong> Anomaly detection (structured alerts)</li>
    </ul>
  </div>
  </div>
</NLayout>
