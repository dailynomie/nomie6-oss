<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { showToast } from '../../components/toast/ToastStore'
  import { Interact } from '../../store/interact'
  import { selectTrackable } from '../trackable/trackable-selector/TrackableSelectorStore'
  import { TrackableStore } from '../trackable/TrackableStore'

  import { EXPERIMENT_DURATIONS, type ExpectedDirection } from './experiment-class'
  import { EXPERIMENT_PRESETS, type ExperimentPreset } from './experiment-presets'
  import { baselineDaysBefore, DAY_FORMAT, dailySeries } from './experiment-data'
  import { loadActiveDays, loadDailyValues } from './experiment-query'
  import { createExperiment } from './experiment-create'

  const { id } = $props()

  type EditorOutcome = { tag: string; label: string; direction: ExpectedDirection; found: boolean; preview: string }

  let step = $state(1)
  let presetId = $state<string | undefined>(undefined)
  let title = $state('')
  let change = $state('')
  let outcomes = $state<Array<EditorOutcome>>([])
  let lagDays = $state<0 | 1>(0)
  let durationDays = $state(14)
  let startChoice = $state<'today' | 'tomorrow'>('today')
  let saving = $state(false)

  const startDay = () => (startChoice === 'today' ? dayjs().startOf('day') : dayjs().add(1, 'day').startOf('day'))

  const trackerByTag = (tag: string) =>
    Object.values($TrackableStore.trackables).find((t: any) => t.tracker?.tag === tag) as any

  const choosePreset = (preset: ExperimentPreset) => {
    presetId = preset.id
    title = preset.title
    change = preset.change
    lagDays = preset.lagDays
    durationDays = preset.durationDays
    outcomes = preset.outcomes.map((o) => {
      const trackable = trackerByTag(o.tag)
      return { tag: o.tag, label: trackable?.label ?? o.tag, direction: o.direction, found: !!trackable, preview: '' }
    })
    step = 2
    updatePreviews()
  }

  const writeOwn = () => {
    presetId = undefined
    outcomes = []
    step = 2
  }

  const addOutcome = async () => {
    const trackable: any = await selectTrackable('tracker')
    if (!trackable) return
    outcomes = [
      ...outcomes,
      { tag: trackable.tracker.tag, label: trackable.label, direction: 'up', found: true, preview: '' },
    ]
    updatePreviews()
  }

  const chooseFor = async (index: number) => {
    const trackable: any = await selectTrackable('tracker')
    if (!trackable) return
    outcomes = outcomes.map((o, i) =>
      i === index ? { ...o, tag: trackable.tracker.tag, label: trackable.label, found: true } : o
    )
    updatePreviews()
  }

  const removeOutcome = (index: number) => {
    outcomes = outcomes.filter((_, i) => i !== index)
  }

  /**
   * How many days of the baseline (the days before the start) the user logged each outcome.
   * Shown so the user knows if there is enough history before starting.
   */
  const updatePreviews = async () => {
    const baselineDays = baselineDaysBefore(startDay().format(DAY_FORMAT), durationDays)
    const first = dayjs(baselineDays[0])
    const last = dayjs(baselineDays[baselineDays.length - 1])
    const active = await loadActiveDays(first, last)
    const updated = await Promise.all(
      outcomes.map(async (o) => {
        if (!o.found) return { ...o, preview: '' }
        const values = await loadDailyValues(o.tag, first, last, $TrackableStore.trackables)
        const trackable = trackerByTag(o.tag)
        const missingAs = trackable?.tracker?.math === 'mean' ? 'skip' : 'zero'
        const logged = Object.keys(dailySeries(baselineDays, values, active, missingAs)).length
        const enough = logged >= 7
        return {
          ...o,
          preview: `You logged ${o.label} on ${logged} of the last ${durationDays} days.${enough ? ' Good baseline.' : ' Less than 7 days: results will be uncertain.'}`,
        }
      })
    )
    outcomes = updated
  }

  const toStepThree = () => {
    if (!outcomes.length) {
      Interact.alert('Add at least one outcome', 'Choose one to 3 trackers to watch.')
      return
    }
    if (outcomes.length > 3) {
      Interact.alert('Too many outcomes', 'Choose up to 3 trackers.')
      return
    }
    if (outcomes.some((o) => !o.found)) {
      Interact.alert('Choose a tracker', 'Each outcome needs one of your trackers.')
      return
    }
    step = 3
  }

  const start = async () => {
    if (!title.trim()) {
      Interact.alert('Name the experiment', 'Write what you will change.')
      return
    }
    saving = true
    try {
      await createExperiment(
        {
          title: title.trim(),
          change: change.trim() || title.trim(),
          outcomes: outcomes.map((o) => ({ tag: o.tag, direction: o.direction, lagDays })),
          start: startDay().format(DAY_FORMAT),
          durationDays,
          presetId,
        },
        $TrackableStore.trackables
      )
      showToast({ message: 'Experiment started' })
      closeModal(id)
    } catch (e) {
      Interact.error(e.message)
    } finally {
      saving = false
    }
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>Cancel</Button>
      </div>
      <h2 class="ntitle">New experiment</h2>
      <div slot="right"></div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-gray-800 dark:text-gray-200">
    {#if step === 1}
      <div class="text-sm text-gray-500">What will you change?</div>
      {#each EXPERIMENT_PRESETS as preset}
        <button class="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800" onclick={() => choosePreset(preset)}>
          <div class="font-semibold">{preset.title}</div>
        </button>
      {/each}
      <button class="w-full text-left p-3 rounded-xl bg-white dark:bg-gray-800" onclick={writeOwn}>
        <div class="font-semibold">Write my own</div>
      </button>
    {:else if step === 2}
      <label class="block text-sm text-gray-500" for="experiment-title">The change</label>
      <input
        id="experiment-title"
        class="w-full p-2 rounded-lg bg-white dark:bg-gray-800"
        placeholder="No coffee after 14:00"
        bind:value={title}
      />

      <div class="text-sm text-gray-500">What should it affect? (1 to 3 trackers)</div>
      {#each outcomes as outcome, index}
        <div class="p-3 rounded-xl bg-white dark:bg-gray-800 space-y-2">
          <div class="flex items-center justify-between">
            <div class="font-semibold">{outcome.label}</div>
            <button class="text-xs text-red-500" onclick={() => removeOutcome(index)}>Remove</button>
          </div>
          {#if !outcome.found}
            <button class="text-sm text-primary-500" onclick={() => chooseFor(index)}>Choose a tracker</button>
          {/if}
          <select class="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700" bind:value={outcome.direction} onchange={updatePreviews}>
            <option value="up">I hope it goes up</option>
            <option value="down">I hope it goes down</option>
            <option value="either">I want to see either way</option>
          </select>
          {#if outcome.preview}
            <div class="text-xs text-gray-500">{outcome.preview}</div>
          {/if}
        </div>
      {/each}
      {#if outcomes.length < 3}
        <button class="text-sm text-primary-500" onclick={addOutcome}>Add a tracker to watch</button>
      {/if}

      <label class="flex items-center space-x-2 text-sm">
        <input type="checkbox" checked={lagDays === 1} onchange={(e) => (lagDays = e.currentTarget.checked ? 1 : 0)} />
        <span>The effect shows the next day</span>
      </label>

      <Button block primary on:click={toStepThree}>Next</Button>
    {:else if step === 3}
      <div class="text-sm text-gray-500">How long?</div>
      <div class="grid grid-cols-4 gap-2">
        {#each EXPERIMENT_DURATIONS as days}
          <button
            class="p-2 rounded-lg {durationDays === days ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800'}"
            onclick={() => {
              durationDays = days
              updatePreviews()
            }}>{days} days</button
          >
        {/each}
      </div>

      <div class="text-sm text-gray-500">When does it start?</div>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="p-2 rounded-lg {startChoice === 'today' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800'}"
          onclick={() => {
            startChoice = 'today'
            updatePreviews()
          }}>Today</button
        >
        <button
          class="p-2 rounded-lg {startChoice === 'tomorrow' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800'}"
          onclick={() => {
            startChoice = 'tomorrow'
            updatePreviews()
          }}>Tomorrow</button
        >
      </div>

      <div class="p-3 rounded-xl bg-white dark:bg-gray-800 text-sm">
        <div class="font-semibold">{title}</div>
        <div class="text-gray-500">
          {durationDays} days from {startDay().format('D MMM YYYY')}, {outcomes.map((o) => o.label).join(', ')}
        </div>
        <div class="text-xs text-gray-500 mt-2">
          Each day you will be asked whether you stuck to it. A check-in tracker is created for this.
        </div>
      </div>

      <Button block primary disabled={saving} on:click={start}>Start experiment</Button>
    {/if}
  </main>
</BackdropModal>
