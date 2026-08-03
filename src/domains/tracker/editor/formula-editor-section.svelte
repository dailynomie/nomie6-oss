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
  import NToggle from '../../../components/toggle-switch/toggle-switch.svelte'
  import Text from '../../../components/text/text.svelte'
  import Divider from '../../../components/divider/divider.svelte'
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import { CircleOutline, CheckmarkCircle } from '../../../components/icon/nicons'
  import { encodeRegex } from '../../../utils/regex'
  import TrackableAvatar from '../../../components/avatar/trackable-avatar.svelte'

  let { trackable = $bindable() } = $props<{ trackable: Trackable }>()

  let tracker: TrackerClass = $state(trackable.tracker)
  let updateTrigger: number = $state(0)
  let lastTrackerRef: TrackerClass | undefined = $state(undefined)

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
        tracker.manualVariables = parsed.manualVariables
      }
    })
  })

  // Get available tracker options
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

  const variableText = $derived(
    parsed.manualVariables.length > 0
      ? parsed.manualVariables.join(', ')
      : 'None'
  )

  // Test formula evaluation
  const testEvaluation = $derived.by(() => {
    if (!parsed.isValid || !tracker) return null

    const trackerMap = new Map(Object.entries($TrackableStore.trackables))
    const context = {
      trackerValues: Object.fromEntries(
        parsed.trackerDependencies.map(tag => {
          const t = trackerMap.get(`#${tag}`)
          return [tag, t?.value || 0]
        })
      ),
      manualVariables: Object.fromEntries(
        parsed.manualVariables.map(v => [v, 0])
      ),
    }

    return FormulaEvaluator.evaluate(formulaInput, context)
  })
</script>

{#if tracker?.type === 'formula'}
  <main class="flex flex-col space-y-4">
    <!-- Formula Input -->
    <List solo>
      <NInput
        listItem
        type="textarea"
        rows={3}
        placeholder="e.g., #calories - manual_deficit"
        label={Lang.t('tracker.formula', 'Formula')}
        bind:value={formulaInput}
      >
        <div slot="right" class="pr-2 pt-1">
          {#if parsed.isValid}
            <IonIcon icon={CheckmarkCircle} className="text-green-500" size={20} />
          {:else if formulaInput}
            <IonIcon icon={CircleOutline} className="text-red-500" size={20} />
          {/if}
        </div>
      </NInput>

      <!-- Error message -->
      {#if formulaInput && !parsed.isValid}
        <div class="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm">
          {parsed.error}
        </div>
      {/if}

      <!-- Autocomplete suggestions for tracker references -->
      {#if autocompleteSuggestions.length > 0}
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Text size="xs" className="text-gray-600 dark:text-gray-400 px-2 py-1 mb-1">Suggestions:</Text>
          <div class="space-y-1">
            {#each autocompleteSuggestions as suggestion}
              <button
                on:click={() => {
                  const lastHashIndex = formulaInput.lastIndexOf('#')
                  if (lastHashIndex !== -1) {
                    const beforeHash = formulaInput.substring(0, lastHashIndex)
                    // Strip any leading # from the tag to avoid ##
                    const tagWithoutHash = suggestion.tag.replace(/^#+/, '')
                    formulaInput = `${beforeHash}#${tagWithoutHash} `
                  }
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 transition text-left"
              >
                {#if suggestion.trackable}
                  <TrackableAvatar trackable={suggestion.trackable} size="sm" />
                {/if}
                <div class="flex-1 min-w-0">
                  <Text size="sm" className="font-medium truncate">#{suggestion.tag}</Text>
                  <Text size="xs" className="text-gray-600 dark:text-gray-400 truncate">{suggestion.label}</Text>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </List>

    <!-- Tracker Dependencies -->
    <List solo>
      <ListItem title={Lang.t('tracker.dependencies', 'Tracker Dependencies')} className="py-2">
        <div slot="right" class="text-right">
          <Text size="sm" className="text-gray-600 dark:text-gray-400">{dependencyText}</Text>
        </div>
      </ListItem>

      {#if availableTrackers.length > 0}
        <Divider left={16} />
        <div class="px-4 py-2">
          <Text size="xs" className="text-gray-500 mb-2">Available trackers:</Text>
          <div class="flex flex-wrap gap-2">
            {#each availableTrackers as { tag, label }}
              <button
                on:click={() => (formulaInput += ` #${tag}`)}
                className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded hover:bg-primary-200 dark:hover:bg-primary-800"
              >
                #{tag}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </List>

    <!-- Manual Variables -->
    {#if parsed.manualVariables.length > 0}
      <List solo>
        <ListItem title={Lang.t('tracker.manual_variables', 'Manual Variables')} className="py-2">
          <div slot="right" class="text-right">
            <Text size="sm" className="text-gray-600 dark:text-gray-400">{variableText}</Text>
          </div>
        </ListItem>
        <Divider left={16} />
        <div class="px-4 py-2">
          <Text size="xs" className="text-gray-500">
            These will be provided during input or calculation.
          </Text>
        </div>
      </List>
    {/if}

    <!-- Test Evaluation -->
    {#if parsed.isValid && testEvaluation}
      <List solo>
        <ListItem title={Lang.t('tracker.test_value', 'Test (with zeros)')} className="py-2">
          <div slot="right" class="text-right">
            <Text bold className="text-primary-500">
              {testEvaluation.isValid ? testEvaluation.value?.toFixed(2) : 'Error'}
            </Text>
          </div>
        </ListItem>
      </List>
    {/if}

    <!-- Options -->
    <List solo>
      <ListItem
        title={Lang.t('tracker.allow_manual_input', 'Allow Manual Input')}
        description={Lang.t('tracker.allow_manual_input_description', 'Let users provide manual variable values during tracking')}
      >
        <NToggle
          slot="right"
          value={tracker.allowManualInput || false}
          on:change={(e) => {
            tracker.allowManualInput = e.detail
            updateTrigger++
          }}
        />
      </ListItem>

      <Divider left={16} />

      <ListItem
        title={Lang.t('tracker.retrospective_calculation', 'Auto-Calculate Historical')}
        description={Lang.t('tracker.retrospective_calculation_description', 'Automatically calculate values for past dates when formula changes')}
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

    <!-- Syntax Help -->
    <div class="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 rounded">
      <Text bold size="sm" className="text-blue-900 dark:text-blue-200 mb-2">Formula Syntax</Text>
      <ul class="text-xs space-y-1 text-blue-800 dark:text-blue-300">
        <li><code>#tag</code> or <code>#{'{tag}'}</code> - Tracker reference</li>
        <li><code>manual_var</code> - Manual variable</li>
        <li><code>sum(), count(), avg(), min(), max(), last()</code> - Array functions</li>
        <li><code>+, -, *, /, ^, ()</code> - Operators and parentheses</li>
      </ul>
    </div>
  </main>
{/if}
