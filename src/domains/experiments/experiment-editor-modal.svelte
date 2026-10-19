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
  import { hasLibraryTracker, installLibraryTracker, libraryTrackerLabel } from './experiment-library'
  import { FeatureVisible } from '../preferences/features'

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
      return {
        tag: o.tag,
        label: trackable?.label ?? libraryTrackerLabel(o.tag) ?? o.tag,
        direction: o.direction,
        found: !!trackable,
        preview: '',
      }
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

  /** Install the library version of a suggested tracker, then use it for this outcome. */
  const installFromLibrary = async (index: number) => {
    const tag = outcomes[index].tag
    const trackable = await installLibraryTracker(tag, $TrackableStore.trackables)
    if (!trackable) {
      Interact.error(`Could not add ${libraryTrackerLabel(tag) ?? tag} from the library`)
      return
    }
    outcomes = outcomes.map((o, i) => (i === index ? { ...o, label: trackable.label, found: true } : o))
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

  const segment = (active: boolean) =>
    `py-2 rounded-xl text-sm font-medium transition-colors ${active ? 'ios-thumb text-ios-label' : 'bg-ios-card text-ios-label'}`
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

  <main class="p-4 space-y-5 text-ios-label">
    <!-- Step indicator -->
    <div class="flex items-center gap-2">
      {#each [1, 2, 3] as n}
        <div class="h-1.5 flex-1 rounded-full {step >= n ? 'bg-ios-tint' : 'bg-ios-fill'}"></div>
      {/each}
    </div>
    <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2 -mt-3">
      {step === 1 ? 'Step 1 of 3 · Choose a change' : step === 2 ? 'Step 2 of 3 · What to watch' : 'Step 3 of 3 · Start'}
    </div>

    {#if step === 1}
      <div class="space-y-2">
        {#each EXPERIMENT_PRESETS as preset}
          <button class="w-full text-left p-4 ios-card hover:ring-2 hover:ring-primary-200 dark:hover:ring-primary-800 transition" onclick={() => choosePreset(preset)}>
            <div class="font-semibold">{preset.title}</div>
            <div class="text-xs text-ios-label2 mt-1">{preset.durationDays} days · {preset.outcomes.length} {preset.outcomes.length === 1 ? 'tracker' : 'trackers'}</div>
          </button>
        {/each}
        {#if $FeatureVisible('experiment-advanced')}
        <button class="w-full text-left p-4 rounded-2xl border-2 border-dashed border-ios-separator hover:border-primary-400 transition" onclick={writeOwn}>
          <div class="font-semibold">Write my own</div>
          <div class="text-xs text-ios-label2 mt-1">Pick any change and the trackers it should affect</div>
        </button>
        {/if}
      </div>
    {:else if step === 2}
      <section class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wide text-ios-label2" for="experiment-title">The change</label>
        <input
          id="experiment-title"
          class="w-full p-3 rounded-xl ios-card outline-none focus:ring-2 focus:ring-primary-300"
          placeholder="No coffee after 14:00"
          bind:value={title}
        />
      </section>

      <section class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2">What should it affect? (1 to 3 trackers)</div>
        {#each outcomes as outcome, index}
          <div class="p-4 ios-card space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="font-semibold truncate">{outcome.label}</div>
              <button class="text-xs font-medium text-ios-danger" onclick={() => removeOutcome(index)}>Remove</button>
            </div>
            {#if !outcome.found}
              <div class="flex flex-wrap gap-3">
                {#if hasLibraryTracker(outcome.tag)}
                  <button class="text-sm font-medium text-ios-tint" onclick={() => installFromLibrary(index)}>Add {libraryTrackerLabel(outcome.tag)} from library</button>
                {/if}
                <button class="text-sm font-medium text-ios-tint" onclick={() => chooseFor(index)}>Choose a tracker</button>
              </div>
            {/if}
            <select class="w-full p-2.5 rounded-xl bg-ios-fill outline-none" bind:value={outcome.direction} onchange={updatePreviews}>
              <option value="up">I hope it goes up</option>
              <option value="down">I hope it goes down</option>
              <option value="either">I want to see either way</option>
            </select>
            {#if outcome.preview}
              <div class="text-xs leading-relaxed text-ios-label2">{outcome.preview}</div>
            {/if}
          </div>
        {/each}
        {#if outcomes.length < 3}
          <button class="w-full p-3 rounded-2xl border-2 border-dashed border-ios-separator text-sm font-medium text-ios-tint" onclick={addOutcome}>+ Add a tracker to watch</button>
        {/if}
      </section>

      {#if $FeatureVisible('experiment-advanced')}
      <label class="flex items-center gap-3 p-4 ios-card text-sm">
        <input type="checkbox" class="w-4 h-4" checked={lagDays === 1} onchange={(e) => (lagDays = e.currentTarget.checked ? 1 : 0)} />
        <span>The effect shows the next day</span>
      </label>
      {/if}

      <Button block primary on:click={toStepThree}>Next</Button>
    {:else if step === 3}
      <section class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2">How long?</div>
        <div class="grid grid-cols-4 gap-2 p-1 rounded-2xl ios-box">
          {#each EXPERIMENT_DURATIONS as days}
            <button
              class={segment(durationDays === days)}
              onclick={() => {
                durationDays = days
                updatePreviews()
              }}>{days}d</button
            >
          {/each}
        </div>
      </section>

      <section class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2">When does it start?</div>
        <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl ios-box">
          <button
            class={segment(startChoice === 'today')}
            onclick={() => {
              startChoice = 'today'
              updatePreviews()
            }}>Today</button
          >
          <button
            class={segment(startChoice === 'tomorrow')}
            onclick={() => {
              startChoice = 'tomorrow'
              updatePreviews()
            }}>Tomorrow</button
          >
        </div>
      </section>

      <section class="p-4 ios-card space-y-3">
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2">Summary</div>
        <div class="font-semibold">{title}</div>
        <div class="text-sm text-ios-label2">
          {durationDays} days from {startDay().format('D MMM YYYY')}
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each outcomes as o}
            <span class="text-xs rounded-full px-2 py-0.5 bg-ios-tintsoft text-ios-tint">{o.label}</span>
          {/each}
        </div>
        <div class="text-xs text-ios-label2 leading-relaxed">
          Each day you will be asked whether you stuck to it. A check-in tracker is created for this.
        </div>
      </section>

      <Button block primary disabled={saving} on:click={start}>Start experiment</Button>
    {/if}
  </main>
</BackdropModal>
