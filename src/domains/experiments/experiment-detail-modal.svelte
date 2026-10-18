<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { Interact } from '../../store/interact'
  import { TrackableStore } from '../trackable/TrackableStore'

  import { ExperimentStore } from './ExperimentStore'
  import type { ExperimentResultSnapshot, ExperimentType } from './experiment-class'
  import { CAVEAT, computeResult, experimentDaysSoFar, verdictText } from './experiment-result'
  import { loadResultInput, recordCheckIn, removeCheckInFromBoards } from './experiment-live'

  const { id, experimentId } = $props()

  let experiment = $derived(
    ($ExperimentStore as Array<any>).find((e) => e.id === experimentId) as ExperimentType | undefined
  )
  let result = $state<ExperimentResultSnapshot | undefined>(undefined)
  let uncheckedDays = $state<Array<string>>([])
  let daysSoFar = $state(0)
  let busy = $state(false)

  const refresh = async () => {
    if (!experiment) return
    const input = await loadResultInput(experiment, $TrackableStore.trackables)
    result = computeResult(input)
    const days = experimentDaysSoFar(experiment.start, experiment.durationDays, input.today)
    daysSoFar = days.length
    uncheckedDays = days.filter((day) => input.adherence[day] === undefined).reverse()
  }

  const checkIn = async (day: string, kept: boolean) => {
    if (!experiment || busy) return
    busy = true
    try {
      await recordCheckIn(experiment, day, kept)
      await refresh()
    } catch (e) {
      Interact.error(e.message)
    } finally {
      busy = false
    }
  }

  const deleteExperiment = async () => {
    if (!experiment) return
    const confirmed = await Interact.confirm('Delete this experiment?', 'The experiment is removed. Your check-in logs are kept.')
    if (!confirmed) return
    const takeOffBoards = await Interact.confirm(
      'Remove the check-in tracker from your boards?',
      'The tracker and its logs are kept. Only its place on your boards is removed.',
      'Remove from boards',
      'Keep on boards'
    )
    const adherenceTag = experiment.adherenceTag
    await ExperimentStore.remove(experiment)
    if (takeOffBoards) await removeCheckInFromBoards(adherenceTag)
    closeModal(id)
  }

  const dayLabel = (day: string) => dayjs(day).format('ddd D MMM')

  $effect(() => {
    if (experiment) refresh()
  })
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>Close</Button>
      </div>
      <h2 class="ntitle">{experiment?.title ?? 'Experiment'}</h2>
      <div slot="right"></div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-gray-800 dark:text-gray-200">
    {#if experiment}
      <div class="text-sm text-gray-500">
        Day {Math.min(daysSoFar, experiment.durationDays)} of {experiment.durationDays}
      </div>

      {#if result}
        <div class="p-3 rounded-xl bg-white dark:bg-gray-800 space-y-1">
          <div class="font-semibold">Kept to it</div>
          <div class="text-sm">
            {result.adherence.kept} of {daysSoFar} days
            {#if result.adherence.unchecked}
              <span class="text-gray-500">({result.adherence.unchecked} not checked in yet)</span>
            {/if}
          </div>
        </div>
      {/if}

      {#if uncheckedDays.length}
        <div class="p-3 rounded-xl bg-white dark:bg-gray-800 space-y-2">
          <div class="font-semibold">Did you stick to it?</div>
          {#each uncheckedDays as day}
            <div class="flex items-center justify-between">
              <span class="text-sm">{dayLabel(day)}</span>
              <div class="space-x-2">
                <button class="px-3 py-1 rounded-lg bg-primary-500 text-white text-sm" disabled={busy} onclick={() => checkIn(day, true)}>Kept to it</button>
                <button class="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm" disabled={busy} onclick={() => checkIn(day, false)}>Didn't</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if result}
        {#each result.outcomes as outcome}
          <div class="p-3 rounded-xl bg-white dark:bg-gray-800 space-y-1">
            <div class="font-semibold">{outcome.tag.replace(/_/g, ' ')}</div>
            <div class="text-sm">
              Before {outcome.meanB.toFixed(1)} → during {outcome.meanE.toFixed(1)}
              {#if outcome.pct !== undefined}
                ({outcome.pct > 0 ? '+' : ''}{outcome.pct.toFixed(0)}%)
              {/if}
            </div>
            <div class="text-sm font-semibold">{verdictText(outcome)}</div>
            <div class="text-xs text-gray-500">
              {outcome.nB} days before, {outcome.nE} days during
            </div>
          </div>
        {/each}
        <div class="text-xs text-gray-500">{CAVEAT}</div>
      {/if}

      <Button block clear className="text-red-500" on:click={deleteExperiment}>Delete experiment</Button>
    {:else}
      <div class="text-gray-500">This experiment could not be found.</div>
    {/if}
  </main>
</BackdropModal>
