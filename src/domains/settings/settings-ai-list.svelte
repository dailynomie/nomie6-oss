<svelte:options runes={true} />

<script lang="ts">
  import IosSelect from '../../components/ios-select/ios-select.svelte'

  import FeatureBadge from '../../components/advanced-badge/feature-badge.svelte'
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
  import { ChevronDownOutline, ChevronUpOutline, SparklesOutline } from '../../components/icon/nicons'
  import IconSquare from '../../components/icon-square/icon-square.svelte'
  import { showToast } from '../../components/toast/ToastStore'
  import type { AIServiceType } from '../preferences/Preferences'
  import { timeFrames } from '../dashboard2/widget/widget-timeframe'
  import { encryptValue, decryptValue } from '../../modules/crypto/crypto-storage'

  let config = $state({
    enabled: $Prefs.ai?.enabled || false,
    selectedService: ($Prefs.ai?.selectedService || 'claude') as AIServiceType,
    apiKey: '',
    defaultTimeframe: $Prefs.ai?.defaultTimeframe || 'last-30',
  })

  let isSaving = $state(false)
  let isExpanded = $state(false)
  let isEncrypted = $state(false)

  const services = [
    { label: Lang.t('settings.claude', 'Claude'), value: 'claude' as AIServiceType },
    { label: 'OpenRouter', value: 'openrouter' as AIServiceType },
  ]

  const getServiceDocs = (service: AIServiceType) => {
    if (service === 'claude') {
      return 'Get your API key from console.anthropic.com'
    } else if (service === 'openrouter') {
      return 'Get your API key from openrouter.ai - Free models available (50 requests/day)'
    }
    return ''
  }

  $effect(() => {
    const service = $Prefs.ai?.services?.[config.selectedService]
    config.apiKey = service?.apiKey || ''
    isEncrypted = service?.encrypted || false
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
          message: Lang.t('settings.api-key-is-required', 'API key is required'),
          type: 'error',
        })
        isSaving = false
        return
      }

      let apiKeyToSave = config.apiKey
      let shouldEncrypt = false

      // If a PIN is set and API key is new (not already encrypted), encrypt it
      if ($Prefs.usePin && config.apiKey && !isEncrypted) {
        try {
          apiKeyToSave = await encryptValue(config.apiKey, $Prefs.usePin)
          shouldEncrypt = true
          showToast({
            message: Lang.t(
              'settings.api-key-will-be-encrypted-with-your-pin',
              'API key will be encrypted with your PIN'
            ),
            type: 'info',
          })
        } catch (error) {
          showToast({
            message:
              Lang.t('settings.failed-to-encrypt-api-key', 'Failed to encrypt API key:') + (error as Error).message,
            type: 'error',
          })
          isSaving = false
          return
        }
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
        p.ai.defaultTimeframe = config.defaultTimeframe

        if (!p.ai.services[config.selectedService]) {
          p.ai.services[config.selectedService] = {}
        }
        p.ai.services[config.selectedService].apiKey = apiKeyToSave
        if (shouldEncrypt) {
          p.ai.services[config.selectedService].encrypted = true
        }

        return p
      })

      showToast({
        message: Lang.t('settings.ai-settings-saved-successfully', 'AI settings saved successfully'),
        type: 'success',
      })
    } finally {
      isSaving = false
    }
  }

  const clearApiKey = () => {
    config.apiKey = ''
    isEncrypted = false
    Prefs.update((p) => {
      if (p.ai?.services?.[config.selectedService]) {
        p.ai.services[config.selectedService].apiKey = ''
        p.ai.services[config.selectedService].encrypted = false
      }
      return p
    })
    showToast({
      message: Lang.t('settings.api-key-cleared', 'API key cleared'),
      type: 'success',
    })
  }
</script>

<List solo className="mb-4" title={Lang.t('settings.ai', 'AI Integration')} outside>
  <ListItem bottomLine={57}>
    <span slot="left" class="adv-corner">
      <IconSquare color="#7D4AA8"><IonIcon icon={SparklesOutline} size={17} /></IconSquare>
      <FeatureBadge feature="ai" />
    </span>
    <div class="leading-tight">
      {config.enabled
        ? Lang.t('settings.ai-features-enabled', 'AI Features Enabled')
        : Lang.t('settings.ai-features-disabled', 'AI Features Disabled')}
    </div>
    <div class="text-xs text-ios-label2 line-clamp-2 leading-tight mt-1">
      {config.enabled
        ? `Using ${config.selectedService}`
        : Lang.t('settings.click-to-enable-ai-integration', 'Click to enable AI integration')}
    </div>
    <div slot="right" class="flex items-center gap-3">
      {#if config.enabled}
        <button
          type="button"
          class="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
          on:click={() => (isExpanded = !isExpanded)}
          title={isExpanded ? Lang.t('settings.collapse', 'Collapse') : Lang.t('settings.expand', 'Expand')}
        >
          <IonIcon icon={isExpanded ? ChevronUpOutline : ChevronDownOutline} size={20} />
        </button>
      {/if}
      <ToggleSwitch bind:value={config.enabled} />
    </div>
  </ListItem>

  {#if config.enabled && !$Prefs.usePin}
    <ListItem bottomLine={16}>
      <!-- iOS look: an information notice is a neutral card; red is reserved for destructive actions -->
      <div class="w-full py-3 p-3 bg-ios-card2 rounded-xl">
        <div class="flex gap-2">
          <span class="flex-shrink-0 text-lg">⚠️</span>
          <div class="flex-grow min-w-0">
            <p class="text-sm font-semibold text-ios-label mb-1">
              {Lang.t('settings.api-key-encryption-available', 'API Key Encryption Available')}
            </p>
            <p class="text-xs text-ios-label2 leading-tight">
              {Lang.t(
                'settings.api-key-local-security',
                'Your Nomie data always stays local on your device, which provides strong security. You can add an additional layer of protection by enabling a PIN in'
              )}
              <span class="font-semibold"
                >{Lang.t('settings.more-settings-security-use-pin', 'More Settings → Security → Use PIN')}</span
              >
              {Lang.t('settings.to-encrypt-your-api-key', 'to encrypt your API key.')}
            </p>
          </div>
        </div>
      </div>
    </ListItem>
  {/if}

  {#if config.enabled && isExpanded}
    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <label class="block text-sm font-semibold mb-3"
          >{Lang.t('settings.select-ai-service', 'Select AI Service')}</label
        >
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
        <label class="block text-sm font-semibold mb-2">{Lang.t('settings.api-key', 'API Key')}</label>
        <p class="text-xs text-ios-label2 mb-3">{getServiceDocs(config.selectedService)}</p>
        {#if config.apiKey}
          {#if isEncrypted}
            <div class="flex items-center gap-2 mb-3 p-2 bg-ios-goodsoft rounded text-ios-good text-xs">
              <span>✓</span>
              <span>{Lang.t('settings.api-key-is-encrypted-with-your-pin', 'API key is encrypted with your PIN')}</span>
            </div>
          {:else if $Prefs.usePin}
            <div class="flex items-center gap-2 mb-3 p-2 bg-ios-tintsoft rounded text-ios-tint text-xs">
              <span>⚠</span>
              <span
                >{Lang.t(
                  'settings.api-key-will-be-encrypted-on-next-save',
                  'API key will be encrypted on next save'
                )}</span
              >
            </div>
          {/if}
        {/if}
        <Input
          type="password"
          placeholder={Lang.t('settings.enter-your-api-key', 'Enter your API key')}
          bind:value={config.apiKey}
          className="mb-3"
        />
        <p class="text-xs text-ios-label2 mb-3">
          {Lang.t(
            'settings.ai-key-notice',
            'Requests go straight from this browser to the provider you chose. The key stays on this device. A short PIN gives little protection for the key.'
          )}
        </p>
        {#if config.apiKey}
          <!-- iOS look (D-destructive-row): clearing the saved key removes data, so it is the red text control -->
          <Button size="sm" clear className="text-ios-danger mr-2" on:click={clearApiKey}
            >{Lang.t('settings.clear-key', 'Clear Key')}</Button
          >
        {/if}
      </div>
    </ListItem>

    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <label class="block text-sm font-semibold mb-3"
          >{Lang.t('settings.default-data-timeframe', 'Default Data Timeframe')}</label
        >
        <p class="text-xs text-ios-label2 mb-3">
          {Lang.t(
            'settings.used-for-ai-features-that-don-t-have-their-own-t',
            "Used for AI features that don't have their own timeframe"
          )}
        </p>
        <IosSelect
          className="w-full"
          title={Lang.t('settings.default-data-timeframe', 'Default Data Timeframe')}
          bind:value={config.defaultTimeframe}
          options={timeFrames.map((timeframe) => ({ value: timeframe.id, label: timeframe.label }))}
        />
      </div>
    </ListItem>

    <Divider left={32} />

    <ListItem bottomLine={16}>
      <div class="w-full py-3">
        <Button primary disabled={isSaving || !config.apiKey} className="w-full" on:click={saveConfig}>
          {isSaving
            ? Lang.t('settings.saving', 'Saving...')
            : Lang.t('settings.save-configuration', 'Save Configuration')}
        </Button>
      </div>
    </ListItem>
  {/if}
</List>
