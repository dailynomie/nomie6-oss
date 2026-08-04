<svelte:options runes={true} />

<script lang="ts">
  import NoteCombo from './note-combo.svelte'

  /**
   * Tracker Input Mege Component
   * This is a beast... Brace yourself.
   * Officialy "walk through" - Nov 2 2019
   *
   * Update: Feb 2022 - starting to get a handle on this thing 3 years later!
   * Moved a bunch of the logic into its own domain. Today is a big
   * cleanup and moving it to a new Backdrop2 modal
   */

  // svelte

  // Components

  //Container for Slider (range), Keypad and Timer
  import SliderInput from './slider.svelte'
  import PickerInput from './picker.svelte'
  import NTimer from './timer.svelte'
  import HabitInput from './habit.svelte'

  import NCalculator from '../../../components/calculator/calculator.svelte'

  // Utils

  // Stores

  import { Lang } from '../../../store/lang'

  import Button from '../../../components/button/button.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import type { TrackerInputProps } from './TrackerInputStore'
  import type TrackerClass from '../../../modules/tracker/TrackerClass'
  import { Device } from '../../../store/device-store'
  import InputModalFooter from './input-modal-footer.svelte'
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import { MoreVertical } from '../../../components/icon/nicons'

  import KeyDown from '../../../modules/keyDown/keyDown.svelte'
  import { openTrackableEditor } from '../../trackable/trackable-editor/TrackableEditorStore'
  import { startTimer, stopTimer, resetTimer } from '../TrackerStore'
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../../components/backdrop/BackdropStore2'
  import type { TrackerInputResponseType } from './tracker-input-utils'
  import Text from '../../../components/text/text.svelte'
  import { FormulaEvaluator } from '../../../modules/formula'
  import { TrackableStore } from '../../trackable/TrackableStore'
  import { TodayStore } from '../../usage/today/TodayStore'
  import { UsageLast } from '../../usage/UsageStore'

  // Props

  let tracker = $state<TrackerClass | undefined>(undefined)
  let manual = $state(false)
  let nextLabel = $state(undefined)
  let saveLabel = $state('Save')

  let data = $state({
    value: null, // holds current value
    ready: false,
    suffix: '',
    calcUsed: false, // when it's ready
    editing: false,
    saving: false,
    note: undefined as undefined | string,
  })

  let { value = $bindable(), id, payload } = $props()

  $effect(() => {
    nextLabel = payload?.nextLabel
  })

  // Set up the Methods
  const methods = {
    // When the Save is hit
    onSave() {
      // Dispatch value and tracker
      if (!data.saving) {
        data.saving = true
        const results: TrackerInputResponseType = {
          value: data.value,
          tracker: tracker,
          suffix: data.suffix,
          action: 'save',
          note: `#${tracker.tag}${data.value ? `(${data.value})` : ``} ${tracker.getIncluded(data.value)}`.trim(),
        }
        // dispatch('save', results)
        resetTimer(tracker)
        payload.onComplete(results)
        closeModal(id)
        data.saving = false
      }
    },
    // When Add is hit
    onAdd() {
      // Dispatch add
      resetTimer(tracker)
      payload.onComplete({
        value: data.value,
        action: 'add',
        tracker: tracker,
        suffix: data.suffix,
        note: `#${tracker.tag}${data.value ? `(${data.value})` : ``} ${tracker.getIncluded(data.value)}`.trim(),
      })
      closeModal(id)
    },
    async onCancel() {
      if (tracker.type === 'timer' && !tracker.started) {
        await resetTimer(tracker)
      }
      closeModal(id)
    },
    // When the user starts the time
    async startTimer() {
      // Start the Timer for this tracker
      tracker = await startTimer(tracker)
      methods.onCancel()
    },
    // Stop the Timer
    async stopTimer() {
      // Get the Seconds between now and when the tracker started
      if (tracker.started) {
        tracker = await stopTimer(tracker)
        data.value = tracker.timeTracked
      }
    },
  }

  function editTracker() {
    openTrackableEditor(tracker.toTrackable())
    // TrackerStore.trackerOptions(tracker, {
    //   click() {
    //     Interact.dismissTrackerInput()
    //   },
    // })
    // Interact.editTracker(tracker);
  }

  const initialize = async () => {
    tracker = payload.tracker

    // If the value changes, and no data.value exists.
    if (value && data.value !== undefined) {
      data.value = value
    } else if (tracker.type === 'formula') {
      // Calculate formula value using TodayStore with fallback to last tracked value
      const context = {
        trackerValues: Object.fromEntries(
          (tracker.trackerDependencies || []).map(tag => {
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
        manualVariables: Object.fromEntries(
          (tracker.manualVariables || []).map(v => [v, 0])
        ),
      }
      const result = FormulaEvaluator.evaluate(tracker.formula || '', context)
      data.value = result.isValid ? result.value : 0
    } else {
      data.value = tracker.default || 0
    }

    if (payload.retrospective) {
      manual = true
    }

    setTimeout(() => {
      data.ready = true
    }, 12)
  }

  initialize();
</script>

<BackdropModal className="tracker-input-modal">
  <KeyDown
    on:Escape={() => {
      methods.onCancel()
    }}
    on:key={(key) => {
      if (key.detail == 'Enter') {
        methods.onSave()
      }
    }}
  />
  <header slot="header">
    <ToolbarGrid>
      <span class="animate line-clamp-1 up text-md ntitle {data.ready ? 'visible' : 'hidden'}">
        <!-- <span style="color:{tracker.color}" class="mr-1">
          {tracker.emoji}
        </span> -->
        {tracker.label}
      </span>
      <div slot="right">
        <Button icon on:click={editTracker}>
          <IonIcon icon={MoreVertical} size={26} className="text-primary-500" />
        </Button>
      </div>
    </ToolbarGrid>
  </header>
  {#if payload.tracker}
    <main class=" relative z-20 {tracker.type === 'range' ? 'filler' : 'h-full'}">
      <!-- Is the data ready -->
      {#if data.ready === true}
        <!-- Slide in the input -->
        <div class="input-modal filler h-full type-{tracker.type}">
          {#if tracker.type === 'range'}
            <SliderInput
              {tracker}
              value={(data.value || tracker.min) + ''}
              min={(tracker.min || 0) + ''}
              max={(tracker.max || 0) + ''}
              on:change={(value) => {
                data.value = value.detail
              }}
            />
          {:else if tracker.type === 'note'}
            <NoteCombo
              {tracker}
              on:note={(evt) => {
                data.suffix = evt.detail
                data.value = 1
              }}
            />
          {:else if tracker.type === 'picker'}
            <PickerInput
              {tracker}
              on:enterEdit={(evt) => {
                data.editing = true
              }}
              on:enterView={() => {
                data.editing = false
              }}
              on:change={(evt) => {
                data.suffix = evt.detail.join(' ')
              }}
            />
          {:else if tracker.type === 'value' || tracker.type === 'tick'}
            <NCalculator
              value={data.value}
              displayFormat={(input) => {
                return tracker.displayValue(input || '')
              }}
              on:change={(changedValue) => {
                data.value = changedValue.detail
              }}
            />
          {:else if tracker.type === 'timer'}
            <div
              style="min-height:{$Device.width > 500 ? '500px' : '30vh'}"
              class="filler flex items-center justify-center"
            >
              <NTimer
                {tracker}
                {manual}
                value={data.value}
                on:forceStart={methods.startTimer}
                on:change={async (event) => {
                  data.value = event.detail
                  tracker = await resetTimer(tracker, event.detail)
                }}
              />
            </div>
          {:else if tracker.type === 'habit'}
          <HabitInput
          {tracker}
          value={data.value}
          on:change={(value) => {
            data.value = value.detail
          }}

        />
          {:else if tracker.type === 'formula'}
            <div class="flex flex-col items-center justify-center h-full space-y-4 p-4 formula-display">
              <div class="text-center">
                <div class="formula-sublabel">Calculated Value</div>
                <div class="text-4xl font-bold text-primary-600 dark:text-primary-400">
                  {data.value !== null && data.value !== undefined ? data.value : '0'}
                </div>
              </div>
              <div class="formula-info">
                Formula: <code class="formula-code">{tracker.formula}</code>
              </div>
            </div>
          {:else}
            <div id="keypad-holder">
              <NCalculator
                {value}
                displayFormat={(input) => {
                  return tracker.displayValue(input || '')
                }}
                on:change={(value) => {
                  data.value = value.detail
                }}
              />
            </div>
          {/if}
        </div>
        <!-- <div class="h-20" /> -->
      {/if}
    </main>
  {/if}
  <InputModalFooter
    slot="footer"
    {tracker}
    bind:value={data.value}
    bind:saveLabel
    bind:nextLabel
    bind:allowSave={payload.allowSave}
    on:add={() => methods.onAdd()}
    on:startTimer={() => methods.startTimer()}
    on:stopTimer={() => methods.stopTimer()}
    on:cancel={() => methods.onCancel()}
    on:save={() => methods.onSave()}
    bind:saving={data.saving}
  />
</BackdropModal>

<style global lang="postcss">
  .tracker-input-modal {
    @apply bg-gray-200 h-full dark:bg-gray-800;
    @apply h-full;
  }

  .tracker-input {
    /* display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    flex-grow: 1;
    height: 100%;
    @apply border-2 border-pink-500; */
  }
  .tracker-input .btn.w-25 {
    width: 30% !important;
  }
  .tracker-input .btn.w-25:first-child {
    margin-right: 10px;
  }
  .tracker-input .footer .btn {
    border-radius: 50px;
  }
  .tracker-input .edit-toggle {
    position: fixed;
    top: 20px;
    z-index: 1000;
  }

  .action-button {
    @apply rounded-full;
    @apply h-11;
    @apply flex;
    @apply items-center justify-center;
    @apply font-semibold;
    @apply text-lg;
    @apply flex-grow;
    @apply text-center;
    @apply transition-all;
    @apply transform;
  }
  .action-button:focus {
    @apply scale-95;
    @apply ring-2 ring-primary-600;
  }

  .formula-display .formula-sublabel {
    font-size: 0.75rem;
    color: var(--text-secondary, #374151);
    margin-bottom: 0.5rem;
  }

  :global(.dark) .formula-display .formula-sublabel {
    color: #f0f0f0;
  }

  .formula-display .formula-info {
    font-size: 0.75rem;
    color: var(--text-secondary, #374151);
  }

  :global(.dark) .formula-display .formula-info {
    color: #f0f0f0;
  }

  .formula-display .formula-code {
    font-family: monospace;
    font-size: 0.75rem;
    background-color: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #1f2937);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.25rem;
  }

  :global(.dark) .formula-display .formula-code {
    background-color: #374151;
    color: #ffffff;
  }
</style>
