<svelte:options runes={true} />

<script lang="ts">
  import { Prefs } from '../preferences/Preferences'
  import { Lang } from '../../store/lang'
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import Divider from '../../components/divider/divider.svelte'
  import ButtonGroup from '../../components/button-group/button-group.svelte'
  import Input from '../../components/input/input.svelte'
  import Button from '../../components/button/button.svelte'
  import ToggleSwitch from '../../components/toggle-switch/toggle-switch.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { ChevronDownOutline, ChevronUpOutline } from '../../components/icon/nicons'
  import { showToast } from '../../components/toast/ToastStore'
  import type { AIServiceType } from '../preferences/Preferences'

  let config = $state({
    enabled: $Prefs.ai?.enabled || false,
    selectedService: ($Prefs.ai?.selectedService || 'claude') as AIServiceType,
    apiKey: '',
  })

  let isSaving = $state(false)
  let isExpanded = $state(false)

  const services = [
    { label: 'Claude', value: 'claude' as AIServiceType },
    { label: 'ChatGPT (Coming Soon)', value: 'chatgpt' as AIServiceType, disabled: true },
  ]

  const getServiceInfo = (service: AIServiceType) => {
    if (service === 'claude') {
      return {
        docs: 'Get your API key from console.anthropic.com',
        icon: '🧠',
      }
    } else if (service === 'chatgpt') {
      return {
        docs: 'ChatGPT support coming soon',
        icon: '🤖',
      }
    }
    return { docs: '', icon: '🔑' }
  }

  $effect(() => {
    config.apiKey = $Prefs.ai?.services?.[config.selectedService]?.apiKey || ''
  })

  // Save enabled state immediately when toggled
  $effect(() => {
    Prefs.update((p) => {
      if (!p.ai) {
        p.ai = { enabled: false, selectedService: 'claude', services: {} }
      }
      p.ai.enabled = config.enabled
      return p
    })
  })

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
        if (!p.ai) {
          p.ai = { enabled: false, selectedService: 'claude', services: {} }
        }
        if (!p.ai.services) {
          p.ai.services = {}
        }

        p.ai.enabled = config.enabled
        p.ai.selectedService = config.selectedService

        if (!p.ai.services[config.selectedService]) {
          p.ai.services[config.selectedService] = {}
        }
        p.ai.services[config.selectedService].apiKey = config.apiKey

        return p
      })

      showToast({
        message: 'AI settings saved successfully',
        type: 'success',
      })
    } finally {
      isSaving = false
    }
  }

  const clearApiKey = () => {
    config.apiKey = ''
    Prefs.update((p) => {
      if (p.ai?.services?.[config.selectedService]) {
        p.ai.services[config.selectedService].apiKey = ''
      }
      return p
    })
    showToast({
      message: 'API key cleared',
      type: 'success',
    })
  }

</script>

<List solo className="mb-4" title={Lang.t('settings.ai', 'AI Integration')} outside>
  <ListItem bottomLine={16}>
    <span slot="left">{getServiceInfo(config.selectedService).icon}</span>
    <div class="font-semibold leading-tight">
      {config.enabled ? 'AI Features Enabled' : 'AI Features Disabled'}
    </div>
    <div class="text-xs text-gray-500 line-clamp-2 leading-tight mt-1">
      {config.enabled ? `Using ${config.selectedService}` : 'Click to enable AI integration'}
    </div>
    <div slot="right" class="flex items-center gap-3">
      {#if config.enabled}
        <button
          type="button"
          class="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
          on:click={() => (isExpanded = !isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <IonIcon icon={isExpanded ? ChevronUpOutline : ChevronDownOutline} size={20} />
        </button>
      {/if}
      <ToggleSwitch bind:value={config.enabled} />
    </div>
  </ListItem>

  {#if config.enabled && isExpanded}
    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <label class="block text-sm font-semibold mb-3">Select AI Service</label>
        <ButtonGroup
          compact
          bind:value={config.selectedService}
          buttons={services.map((s) => ({
            label: s.label,
            value: s.value,
            disabled: s.disabled || false,
          }))}
        />
      </div>
    </ListItem>

    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <label class="block text-sm font-semibold mb-2">API Key</label>
        <p class="text-xs text-gray-500 mb-3">{getServiceInfo(config.selectedService).docs}</p>
        <Input
          type="password"
          placeholder="Enter your API key"
          bind:value={config.apiKey}
          className="mb-3"
        />
        {#if config.apiKey}
          <Button size="sm" className="bg-gray-200 dark:bg-gray-800 mr-2" on:click={clearApiKey}>
            Clear Key
          </Button>
        {/if}
      </div>
    </ListItem>

    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <Button
          primary
          disabled={isSaving || !config.apiKey}
          className="w-full"
          on:click={saveConfig}
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </ListItem>
  {/if}
</List>
