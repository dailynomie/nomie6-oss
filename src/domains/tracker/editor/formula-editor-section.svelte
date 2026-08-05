<svelte:options runes={true} />

<script lang="ts">
  import { untrack } from 'svelte'
  import type { Trackable } from '../../trackable/Trackable.class'
  import type TrackerClass from '../../../modules/tracker/TrackerClass'
  import { FormulaParser, FormulaEvaluator, CircularDependencyDetector } from '../../../modules/formula'
  import { TrackableStore } from '../../trackable/TrackableStore'
  import { Lang } from '../../../store/lang'

  import List from '../../../components/list/list.svelte'
  import ListItem from '../../../components/list-item/list-item.svelte'
  import NInput from '../../../components/input/input.svelte'
  import FormulaInput from '../../../components/input/formula-input.svelte'
  import NToggle from '../../../components/toggle-switch/toggle-switch.svelte'
  import Text from '../../../components/text/text.svelte'
  import Divider from '../../../components/divider/divider.svelte'
  import Button from '../../../components/button/button.svelte'
  import { encodeRegex } from '../../../utils/regex'
  import { TodayStore } from '../../usage/today/TodayStore'
  import { UsageLast } from '../../usage/UsageStore'
  import { getGroupedUoms, uomPlural, uomSymbol } from '../../uom/uom-utils'
  import { calculateRetrospective } from '../../../modules/formula/formula-retrospective'
  import { recalculateFormulaRange } from '../../../modules/formula/formula-recalculation'
  import { showToast } from '../../../components/toast/ToastStore'
  import { openModal } from '../../../components/backdrop/BackdropStore2'
  import RetrospectiveConfirmationModal from './retrospective-confirmation-modal.svelte'
  import FormulaRecalculationModal from './formula-recalculation-modal.svelte'

  let { trackable = $bindable() } = $props<{ trackable: Trackable }>()

  let tracker: TrackerClass = $state(trackable.tracker)
  let updateTrigger: number = $state(0)
  let lastTrackerRef: TrackerClass | undefined = $state(undefined)
  let originalFormula: string | undefined = $state(tracker?.formula)
  let retrospectiveDays: number = $state(7)
  let retrospectiveLoading: boolean = $state(false)
  let retrospectiveCalculated: { date: string; value: number }[] = $state([])
  let retrospectiveSkipped: string[] = $state([])
  let recalculationLoading: boolean = $state(false)
  const retrospectiveModalId = 'retrospective-confirmation-modal'
  const recalculationModalId = 'formula-recalculation-modal'

  const groupedUOM = getGroupedUoms()

  // State for formula editing
  let formulaInput: string = $state('')
  let parsed = $derived.by(() => {
    if (!formulaInput) {
      return {
        formula: '',
        trackerDependencies: [],
        manualVariables: [],
        isValid: false,
        error: 'Formula is empty',
      }
    }
    const result = FormulaParser.parse(formulaInput)
    if (result.isValid && tracker) {
      // Check for circular dependencies
      const trackerMap = new Map(Object.entries($TrackableStore.trackables))
      const cycleCheck = CircularDependencyDetector.detect(trackerMap)

      if (cycleCheck.hasCycle) {
        const affectedTags = result.trackerDependencies.filter(tag => cycleCheck.affectedTrackers.includes(tag))
        if (affectedTags.length > 0) {
          return {
            ...result,
            isValid: false,
            error: `Circular dependency detected: ${cycleCheck.cycles[0].chain}`,
          }
        }
      }
    }
    return result
  })

  // Sync tracker reference
  $effect(() => {
    updateTrigger
    if (trackable?.tracker !== lastTrackerRef) {
      tracker = trackable.tracker
      lastTrackerRef = trackable.tracker
      formulaInput = tracker?.formula || ''
      originalFormula = tracker?.formula
    }
  })

  // Update tracker properties on formula change
  $effect(() => {
    // Depend on formulaInput and parsed to trigger updates
    formulaInput
    parsed

    untrack(() => {
      if (tracker && parsed.isValid) {
        // Update tracker properties without creating reactive dependency
        tracker.formula = formulaInput
        tracker.trackerDependencies = parsed.trackerDependencies
      }
    })
  })

  // Recalculate historical formula values
  const handleRecalculateFormula = async (days: number) => {
    if (!tracker.formula || !tracker.trackerDependencies?.length) {
      showToast({ message: 'Formula must have dependencies to recalculate', type: 'warning' })
      return
    }

    recalculationLoading = true
    try {
      const results = await recalculateFormulaRange(tracker, $TrackableStore.trackables, days)

      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      if (successful > 0) {
        showToast({
          message: `Recalculated ${successful} days${failed > 0 ? `, ${failed} failed` : ''}`,
          type: 'success',
        })
      } else {
        showToast({ message: 'No values were recalculated', type: 'info' })
      }

      originalFormula = tracker.formula
    } catch (error) {
      console.error('Recalculation error:', error)
      showToast({ message: 'Error recalculating values', type: 'error' })
    } finally {
      recalculationLoading = false
    }
  }

  // Check if formula changed and prompt for recalculation (called on save)
  export const checkAndPromptForRecalculation = async () => {
    if (formulaInput && originalFormula && formulaInput !== originalFormula) {
      return new Promise<void>((resolve) => {
        openModal({
          id: recalculationModalId,
          component: FormulaRecalculationModal,
          componentProps: {
            id: recalculationModalId,
            trackerTag: tracker.tag,
            onConfirm: async (days: number) => {
              await handleRecalculateFormula(days)
              originalFormula = formulaInput
              resolve()
            },
            onCancel: () => {
              originalFormula = formulaInput
              resolve()
            },
          },
        })
      })
    }
  }

  // Handle manual retrospective calculation
  const handleRetrospectiveCalculation = async () => {
    if (!tracker.formula || !tracker.trackerDependencies?.length) {
      showToast({ message: 'Formula must have dependencies to calculate retrospectively', type: 'warning' })
      return
    }

    retrospectiveLoading = true
    try {
      const result = await calculateRetrospective({
        tracker,
        knownTrackables: $TrackableStore.trackables,
        maxDays: retrospectiveDays,
      })

      if (result.calculated.length === 0) {
        showToast({ message: 'No days to calculate (all days have existing values)', type: 'info' })
      } else {
        // Show confirmation modal as separate overlay
        retrospectiveCalculated = result.calculated
        retrospectiveSkipped = result.skipped
        openModal({
          id: retrospectiveModalId,
          component: RetrospectiveConfirmationModal,
          componentProps: {
            id: retrospectiveModalId,
            calculated: result.calculated,
            skipped: result.skipped,
            onConfirm: handleConfirmRetrospective,
            onCancel: handleCancelRetrospective,
          },
        })
      }
    } catch (error) {
      console.error('Retrospective calculation error:', error)
      showToast({ message: 'Error calculating retrospective values', type: 'error' })
    } finally {
      retrospectiveLoading = false
    }
  }

  // Handle saving confirmed retrospective values
  const handleConfirmRetrospective = () => {
    if (!tracker.calculatedValues) {
      tracker.calculatedValues = {}
    }
    const saveCount = retrospectiveCalculated.length
    retrospectiveCalculated.forEach(({ date, value }) => {
      tracker.calculatedValues![date] = value
    })
    retrospectiveCalculated = []
    retrospectiveSkipped = []
    updateTrigger++
    showToast({ message: `Saved ${saveCount} calculated values`, type: 'success' })
  }

  // Handle canceling retrospective calculation
  const handleCancelRetrospective = () => {
    retrospectiveCalculated = []
    retrospectiveSkipped = []
  }

  // Get available tracker options (used for autocomplete suggestions)
  const availableTrackers = $derived.by(() => {
    return Object.entries($TrackableStore.trackables)
      .filter(([_, trackable]) => trackable?.type === 'tracker' && trackable?.tag && trackable?.label)
      .map(([_, trackable]) => ({
        tag: trackable.tag,
        label: trackable.label,
        trackable: trackable,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  })

  // Get autocomplete suggestions for current input
  const autocompleteSuggestions = $derived.by(() => {
    const lastHashIndex = formulaInput.lastIndexOf('#')
    if (lastHashIndex === -1) return []

    // Extract text after the last #
    const afterHash = formulaInput.substring(lastHashIndex + 1)

    // Don't show suggestions if there's a space after # (formula continues)
    if (afterHash.includes(' ')) return []

    // Search for matching trackers
    const searchTerm = afterHash.toLowerCase()
    return availableTrackers
      .filter(t => t?.tag && t?.label) // Guard against undefined tag/label
      .filter(t =>
        t.tag.toLowerCase().includes(searchTerm) ||
        t.label.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5) // Limit to 5 suggestions
  })

  // Format tracker dependencies for display
  const dependencyText = $derived(
    parsed.trackerDependencies.length > 0
      ? parsed.trackerDependencies.map(t => `#${t}`).join(', ')
      : 'None detected'
  )

  // Test formula evaluation
  const testEvaluation = $derived.by(() => {
    if (!parsed.isValid || !tracker) return null

    console.log('TodayStore.usage keys:', Object.keys($TodayStore.usage))
    console.log('Parsed dependencies:', parsed.trackerDependencies)

    const context = {
      trackerValues: Object.fromEntries(
        parsed.trackerDependencies.map(tag => {
          // TodayStore.usage keys include the # prefix
          const todayUsage = $TodayStore.usage[`#${tag}`]
          let value = todayUsage?.total

          // If not in today's usage, fall back to last tracked value
          if (value === undefined || value === 0) {
            const lastUsed = $UsageLast[tag]
            value = lastUsed?.v || 0
          }

          return [tag, value]
        })
      ),
    }

    return FormulaEvaluator.evaluate(formulaInput, context)
  })
</script>

{#if tracker?.type === 'formula'}
  <main class="flex flex-col space-y-4">
    <!-- Formula Input -->
    <List solo>
      <FormulaInput
        placeholder="e.g., #calories * 2"
        label={Lang.t('tracker.formula', 'Formula')}
        bind:value={formulaInput}
        isValid={parsed.isValid}
      />

      <!-- Error message -->
      {#if formulaInput && !parsed.isValid}
        <div class="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm">
          {parsed.error}
        </div>
      {/if}

      <!-- Autocomplete suggestions for tracker references -->
      {#if autocompleteSuggestions.length > 0}
        <div class="suggestions-container rounded-lg p-4 space-y-2">
          <Text size="xs" className="text-gray-600 dark:text-gray-400 mb-3">Suggestions:</Text>
          <div class="space-y-2">
            {#each autocompleteSuggestions as suggestion}
              <button
                on:click={() => {
                  const lastHashIndex = formulaInput.lastIndexOf('#')
                  if (lastHashIndex !== -1) {
                    const beforeHash = formulaInput.substring(0, lastHashIndex)
                    const tagWithoutHash = suggestion.tag.replace(/^#+/, '')
                    formulaInput = `${beforeHash}#${tagWithoutHash} `
                  }
                }}
                class="suggestion-item w-full px-3 py-2 rounded text-left border transition"
              >
                <div class="flex items-center gap-2">
                  {#if suggestion.trackable?.emoji}
                    <span class="text-xl flex-shrink-0">{suggestion.trackable.emoji}</span>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <Text size="sm" className="font-medium text-gray-900 dark:text-white">#{suggestion.tag.replace(/^#+/, '')}</Text>
                    <Text size="xs" className="text-gray-600 dark:text-gray-400">{suggestion.label}</Text>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </List>

    <!-- Tracker Dependencies -->
    <List solo>
      <ListItem title={Lang.t('tracker.dependencies', 'Tracker Dependencies')} class="py-2">
        <div slot="right" class="text-right">
          <Text size="sm" class="text-gray-600 dark:text-gray-400">{dependencyText}</Text>
        </div>
      </ListItem>
    </List>

    <!-- Test Evaluation -->
    {#if parsed.isValid && testEvaluation}
      <List solo>
        <ListItem title={Lang.t('tracker.test_value', 'Test (with zeros)')} class="py-2">
          <div slot="right" class="text-right">
            <Text bold class="text-primary-500">
              {testEvaluation.isValid ? testEvaluation.value?.toFixed(2) : 'Error'}
            </Text>
          </div>
        </ListItem>
      </List>
    {/if}

    <!-- Measure By and Calculate Totals -->
    <List solo>
      <NInput
        listItem
        placeholder={Lang.t('tracker.measure-by', 'Measure By')}
        type="select"
        class="tracker-uom"
        bind:value={tracker.uom}
      >
        {#each Object.keys(groupedUOM) as groupKey (groupKey)}
          {#if groupKey !== 'Timer'}
            <option disabled>-- {groupKey}</option>
            {#each groupedUOM[groupKey] as uom (`${groupKey}-${uom.key}`)}
              <option value={uom.key}>
                {uomPlural(uom.key)}
                {#if uomPlural(uom.key).toLowerCase() !== uomSymbol(uom.key).toLowerCase()}
                  {#if uomSymbol(uom.key).length > 0}
                    ({uomSymbol(uom.key)})
                  {/if}
                {/if}
              </option>
            {/each}
          {/if}
        {/each}
      </NInput>
      <Divider center />
      <NInput
        listItem
        type="select"
        class="tracker-math mb-3"
        name="math"
        placeholder={Lang.t('tracker.calculate-total', 'Calculate Totals')}
        bind:value={tracker.math}
      >
        {#each [{ value: 'sum', label: Lang.t('general.sum', 'Sum') }, { value: 'mean', label: Lang.t('general.avg', 'Average') }] as math_key}
          <option value={math_key.value}>{math_key.label}</option>
        {/each}
      </NInput>
    </List>

    <!-- Options -->
    <List solo>
      <ListItem
        title={Lang.t('tracker.save-on-tap', 'Save on Tap')}
        description={Lang.t('tracker.save-on-tap-description', 'Save calculated value immediately after tapping the button.')}
      >
        <NToggle
          slot="right"
          value={tracker.one_tap || false}
          on:change={(e) => {
            tracker.one_tap = e.detail
            updateTrigger++
          }}
        />
      </ListItem>


      <Divider left={16} />

      <ListItem
        title={Lang.t('tracker.retrospective_calculation', 'Auto-Calculate Historical')}
        description={Lang.t('tracker.retrospective_calculation_description', 'Automatically calculate values for past dates on app startup (once per day)')}
      >
        <NToggle
          slot="right"
          value={tracker.retrospectiveCalculation || false}
          on:change={(e) => {
            tracker.retrospectiveCalculation = e.detail
            updateTrigger++
          }}
        />
      </ListItem>
    </List>

    <!-- Manual Retrospective Calculation -->
    <List solo>
      <div class="px-4 py-4 space-y-3">
        <Text bold size="sm" className="text-gray-900 dark:text-white">Manual Retrospective Calculation</Text>
        <NInput
          listItem={false}
          type="number"
          min="1"
          max="50"
          bind:value={retrospectiveDays}
          disabled={retrospectiveLoading}
          label="Days to go back (max 50)"
        />
        <Button
          primary
          disabled={retrospectiveLoading || !tracker.formula}
          on:click={handleRetrospectiveCalculation}
          className="w-full"
        >
          {retrospectiveLoading ? 'Calculating...' : 'Calculate Historical Values'}
        </Button>
        <Text size="xs" className="text-gray-600 dark:text-gray-400">
          Skips days with existing logged values for this tracker.
        </Text>
      </div>
    </List>

    <!-- Syntax Help -->
    <div class="syntax-info rounded p-3 space-y-2">
      <Text bold size="sm" className="text-blue-900 dark:text-white">Formula Syntax</Text>
      <div class="space-y-1">
        <Text size="xs" className="text-blue-800 dark:text-gray-100">
          <code>#tag</code> or <code>#{'{tag}'}</code> - Tracker reference
        </Text>
        <Text size="xs" className="text-blue-800 dark:text-gray-100">
          <code>sum(), count(), avg(), min(), max(), last()</code> - Array functions
        </Text>
        <Text size="xs" className="text-blue-800 dark:text-gray-100">
          <code>+, -, *, /, ^, ()</code> - Operators and parentheses
        </Text>
      </div>
    </div>
  </main>
{/if}

<style lang="postcss">
  :global(.syntax-info) {
    background-color: #eff6ff;
  }

  :global(.dark .syntax-info),
  :global([data-theme="dark"] .syntax-info) {
    background-color: #0c2940;
  }

  :global(.syntax-info code) {
    @apply bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded font-mono text-xs text-blue-900 dark:text-white;
  }

  :global(.suggestions-container) {
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
  }

  :global(.dark .suggestions-container),
  :global([data-theme="dark"] .suggestions-container) {
    background-color: #1f2937;
    border-color: #374151;
  }

  :global(.suggestion-item) {
    background-color: #ffffff;
    border-color: #d1d5db;
  }

  :global(.suggestion-item:hover) {
    background-color: #f9fafb;
  }

  :global(.dark .suggestion-item),
  :global([data-theme="dark"] .suggestion-item) {
    background-color: #111827;
    border-color: #374151;
  }

  :global(.dark .suggestion-item:hover),
  :global([data-theme="dark"] .suggestion-item:hover) {
    background-color: #1f2937;
  }
</style>
