<svelte:options runes={true} />

<script lang="ts">
  import { Prefs } from '../preferences/Preferences'
  import { Lang } from '../../store/lang'
  import ListItem from '../../components/list-item/list-item.svelte'
  import ButtonGroup from '../../components/button-group/button-group.svelte'
  import Input from '../../components/input/input.svelte'
  import Button from '../../components/button/button.svelte'
  import { showToast } from '../../components/toast/ToastStore'
  import type { AIServiceType } from '../preferences/Preferences'
  import { timeFrames } from '../../domains/dashboard2/widget/widget-timeframe'

  console.log('[ai-settings] Component loading. timeFrames:', timeFrames.length, timeFrames)

  let config = $state({
    enabled: $Prefs.ai?.enabled || false,
    service: $Prefs.ai?.selectedService || ('claude' as AIServiceType),
    apiKey: $Prefs.ai?.apiKey || '',
    defaultTimeframe: $Prefs.ai?.defaultTimeframe || 'last-30',
  })

  console.log('[ai-settings] Initial config:', config)

  let isSaving = $state(false)

  const services = [
    { label: 'Claude', value: 'claude' as AIServiceType },
    { label: 'ChatGPT', value: 'chatgpt' as AIServiceType },
  ]

  const getServiceDocs = (service: AIServiceType) => {
    if (service === 'claude') {
      return 'Get your API key from console.anthropic.com'
    } else if (service === 'chatgpt') {
      return 'Get your API key from platform.openai.com'
    }
    return ''
  }

  const saveConfig = async () => {
    isSaving = true
    try {
      if (config.enabled && !config.apiKey) {
        showToast({
          message: 'API key is required',
          type: 'error',
        })
        isSaving = false
        return
      }

      Prefs.update((p) => {
        p.ai = {
          enabled: config.enabled,
          selectedService: config.service,
          apiKey: config.apiKey,
          defaultTimeframe: config.defaultTimeframe,
        }
        return p
      })

      showToast({
        message: 'AI settings saved',
        type: 'success',
      })
    } finally {
      isSaving = false
    }
  }

  const clearApiKey = () => {
    config.apiKey = ''
    Prefs.update((p) => {
      if (p.ai) {
        p.ai.apiKey = ''
      }
      return p
    })
    showToast({
      message: 'API key cleared',
      type: 'success',
    })
  }

  const toggleEnabled = (e: Event) => {
    const target = e.target as HTMLInputElement
    console.log('[ai-settings] Toggle clicked, checked:', target.checked)
    config.enabled = target.checked
    Prefs.update((p) => {
      if (!p.ai) {
        p.ai = {
          enabled: config.enabled,
          selectedService: 'claude',
          defaultTimeframe: 'last-30',
        }
      } else {
        p.ai.enabled = config.enabled
      }
      return p
    })
    console.log('[ai-settings] After toggle, config.enabled:', config.enabled)
  }

  $effect(() => {
    // Sync preferences changes back to local state
    console.log('[ai-settings] Effect running, $Prefs.ai?.enabled:', $Prefs.ai?.enabled)
    config.enabled = $Prefs.ai?.enabled || false
    config.service = $Prefs.ai?.selectedService || ('claude' as AIServiceType)
    config.apiKey = $Prefs.ai?.apiKey || ''
    config.defaultTimeframe = $Prefs.ai?.defaultTimeframe || 'last-30'
    console.log('[ai-settings] Config updated:', config)
  })
</script>

<ListItem bottomLine={16} title="Enable AI Features">
  <div slot="right" class="pr-2">
    <input
      type="checkbox"
      checked={config.enabled}
      on:change={toggleEnabled}
      class="w-5 h-5 accent-primary-500 cursor-pointer"
    />
  </div>
</ListItem>

{#if config.enabled}
  <!-- DEBUG: verify conditional is working and timeFrames loaded -->
  <div class="text-xs bg-yellow-100 text-yellow-800 px-4 py-2 m-2">
    DEBUG: config.enabled = TRUE, timeFrames = {timeFrames.length} items
  </div>

  <ListItem bottomLine={16}>
    <div class="w-full">
      <label class="block text-sm font-semibold mb-2">AI Service</label>
      <ButtonGroup
        compact
        bind:value={config.service}
        buttons={services.map((s) => ({
          label: s.label,
          value: s.value,
        }))}
      />
    </div>
  </ListItem>

  <ListItem bottomLine={16}>
    <div class="w-full py-2">
      <label class="block text-sm font-semibold mb-2">API Key</label>
      <p class="text-xs text-gray-500 mb-2">{getServiceDocs(config.service)}</p>
      <Input
        type="password"
        placeholder="Enter your API key"
        bind:value={config.apiKey}
      />
      {#if config.apiKey}
        <Button size="sm" className="mt-2 bg-gray-200 dark:bg-gray-800" on:click={clearApiKey}>
          Clear Key
        </Button>
      {/if}
    </div>
  </ListItem>

  <ListItem bottomLine={16}>
    <div class="w-full">
      <label class="block text-sm font-semibold mb-2">Default Data Timeframe</label>
      <p class="text-xs text-gray-500 mb-3">This timeframe will be used for all AI analyses</p>
      <select
        bind:value={config.defaultTimeframe}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
      >
        {#each timeFrames as timeframe}
          <option value={timeframe.id}>{timeframe.label}</option>
        {/each}
      </select>
    </div>
  </ListItem>

  <ListItem bottomLine={16}>
    <div class="w-full py-2">
      <Button
        primary
        disabled={isSaving}
        className="w-full"
        on:click={saveConfig}
      >
        {isSaving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  </ListItem>
{/if}
