<svelte:options runes={true} />

<script lang="ts">
  import type TrackerClass from '../../../modules/tracker/TrackerClass'
  import { FormulaEvaluator, CircularDependencyDetector } from '../../../modules/formula'
  import { TrackableStore } from '../../trackable/TrackableStore'
  import { Lang } from '../../../store/lang'

  import List from '../../../components/list/list.svelte'
  import ListItem from '../../../components/list-item/list-item.svelte'
  import NInput from '../../../components/input/input.svelte'
  import Button from '../../../components/button/button.svelte'
  import Divider from '../../../components/divider/divider.svelte'
  import Text from '../../../components/text/text.svelte'
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import { CheckmarkCircle, CircleOutline } from '../../../components/icon/nicons'

  let { tracker = $bindable(), onUseValue } = $props<{
    tracker: TrackerClass,
    onUseValue?: (value: number) => void
  }>()

  let manualValues: { [key: string]: string } = $state({})
  let calculatedValue: number | null = $state(null)
  let evaluationError: string | null = $state(null)

  // Get tracker values for evaluation
  const getTrackerValues = () => {
    const values: { [tag: string]: number } = {}
    const trackerMap = new Map($TrackableStore.trackables)

    if (tracker.trackerDependencies) {
      for (const tag of tracker.trackerDependencies) {
        const trackable = trackerMap.get(`#${tag}`)
        if (trackable && trackable.type === 'tracker' && trackable.value !== undefined) {
          values[tag] = trackable.value
        } else {
          values[tag] = 0
        }
      }
    }

    return values
  }

  // Initialize manual variable states
  $effect(() => {
    if (tracker.manualVariables) {
      const newValues: { [key: string]: string } = {}
      for (const varName of tracker.manualVariables) {
        if (!(varName in manualValues)) {
          newValues[varName] = ''
        }
      }
      manualValues = { ...manualValues, ...newValues }
    }
  })

  // Calculate formula value
  $effect(() => {
    if (tracker.formula && tracker.trackerDependencies) {
      const trackerValues = getTrackerValues()

      const manualVars: { [key: string]: number } = {}
      if (tracker.manualVariables) {
        for (const varName of tracker.manualVariables) {
          const val = parseFloat(manualValues[varName] || '0')
          manualVars[varName] = isNaN(val) ? 0 : val
        }
      }

      const result = FormulaEvaluator.evaluate(tracker.formula, {
        trackerValues,
        manualVariables: manualVars,
      })

      if (result.isValid && result.value !== null) {
        calculatedValue = result.value
        evaluationError = null
      } else {
        calculatedValue = null
        evaluationError = result.error || 'Calculation failed'
      }
    }
  })

  // Get available tracker details
  const getDependencyDetails = () => {
    const trackerMap = new Map($TrackableStore.trackables)
    const details: Array<{ tag: string; label: string; value: number }> = []

    if (tracker.trackerDependencies) {
      for (const tag of tracker.trackerDependencies) {
        const trackable = trackerMap.get(`#${tag}`)
        if (trackable && trackable.type === 'tracker') {
          details.push({
            tag,
            label: trackable.label,
            value: trackable.value || 0,
          })
        }
      }
    }

    return details
  }

  const dependencyDetails = $derived(getDependencyDetails())
</script>

<div class="flex flex-col h-full overflow-y-auto">
  {#if tracker.formula}
    <!-- Formula Display -->
    <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4 mx-4 mt-4">
      <Text size="xs" className="text-blue-900 dark:text-blue-200 mb-1">Formula</Text>
      <Text bold className="text-blue-900 dark:text-blue-200 font-mono break-words">{tracker.formula}</Text>
    </div>

    <!-- Tracker Dependencies -->
    {#if dependencyDetails.length > 0}
      <List solo className="mx-0">
        <div class="px-4 py-2">
          <Text size="xs" className="text-gray-600 dark:text-gray-400 font-semibold mb-3">
            Tracker Values
          </Text>
          <div class="space-y-2">
            {#each dependencyDetails as { tag, label, value }}
              <div class="flex justify-between items-center px-2 py-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                <div>
                  <Text size="sm" className="font-medium">#{tag}</Text>
                  <Text size="xs" className="text-gray-600 dark:text-gray-400">{label}</Text>
                </div>
                <Text bold className="text-primary-600 dark:text-primary-400">{value}</Text>
              </div>
            {/each}
          </div>
        </div>
      </List>
    {/if}

    <!-- Manual Variables Input -->
    {#if tracker.allowManualInput && tracker.manualVariables && tracker.manualVariables.length > 0}
      <List solo className="mx-0">
        <div class="px-4 py-3">
          <Text size="xs" className="text-gray-600 dark:text-gray-400 font-semibold mb-3">
            Manual Variables
          </Text>
          <div class="space-y-3">
            {#each tracker.manualVariables as varName}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {varName}
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  bind:value={manualValues[varName]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            {/each}
          </div>
        </div>
      </List>
    {/if}

    <!-- Calculated Result -->
    <List solo className="mx-0 mt-4">
      <div class="px-4 py-4">
        <div class="flex items-center justify-between mb-2">
          <Text size="sm" className="font-semibold text-gray-700 dark:text-gray-300">
            Calculated Value
          </Text>
          {#if calculatedValue !== null && !evaluationError}
            <IonIcon icon={CheckmarkCircle} className="text-green-500" size={20} />
          {:else if evaluationError}
            <IonIcon icon={CircleOutline} className="text-red-500" size={20} />
          {/if}
        </div>

        {#if calculatedValue !== null && !evaluationError}
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 text-center py-6">
            {calculatedValue.toFixed(2)}
          </div>
        {:else if evaluationError}
          <div className="text-center py-6">
            <Text size="sm" className="text-red-600 dark:text-red-400">
              {evaluationError}
            </Text>
          </div>
        {:else}
          <div className="text-center py-6">
            <Text size="sm" className="text-gray-600 dark:text-gray-400">
              Waiting for calculation...
            </Text>
          </div>
        {/if}
      </div>
    </List>

    <!-- Use Calculated Button -->
    {#if calculatedValue !== null && !evaluationError}
      <div class="px-4 py-3">
        <Button
          block
          primary
          on:click={() => {
            onUseValue?.(calculatedValue)
          }}
        >
          {Lang.t('general.use', 'Use')} {calculatedValue.toFixed(2)}
        </Button>
      </div>
    {/if}
  {:else}
    <div className="h-full flex items-center justify-center">
      <Text className="text-gray-600 dark:text-gray-400">
        Formula not configured
      </Text>
    </div>
  {/if}
</div>
