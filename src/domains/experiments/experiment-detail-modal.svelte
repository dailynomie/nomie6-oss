<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { showToast } from '../../components/toast/ToastStore'
  import { Interact } from '../../store/interact'
  import { TrackableStore } from '../trackable/TrackableStore'

  import { ExperimentStore } from './ExperimentStore'
  import type { ExperimentResultSnapshot, ExperimentType } from './experiment-class'
  import { CAVEAT, computeResult, experimentDaysSoFar, verdictText } from './experiment-result'
  import { endExperiment, loadResultInput, recordCheckIn, removeCheckInFromBoards } from './experiment-live'
  import { outcomeTone } from './experiment-widget-lines'
  import ExperimentProgress from './experiment-progress.svelte'
  import ExperimentChip from './experiment-chip.svelte'
  import NomieAiButton from '../../components/aibutton2/NomieAiButton2.svelte'
  import { serializeExperiment } from './experiment-class'
  import { buildExperimentExplainPrompt } from './experiment-explain-prompt'
  import { query } from '../ai/engine.svelte'
  import { Prefs } from '../preferences/Preferences'
  import { FeatureVisible } from '../preferences/features'
  import Chartjs from '../../components/charts/chartjs.svelte'
  import { outcomeChartConfig } from './experiment-chart'
  import { baselineDaysBefore } from './experiment-data'
  import type { ChartConfiguration } from 'chart.js'

  const { id, experimentId } = $props()

  let experiment = $derived(
    ($ExperimentStore as Array<any>).find((e) => e.id === experimentId) as ExperimentType | undefined
  )
  let liveResult = $state<ExperimentResultSnapshot | undefined>(undefined)
  let uncheckedDays = $state<Array<string>>([])
  let daysSoFar = $state(0)
  let busy = $state(false)
  let explaining = $state(false)
  let aiReady = $derived(
    !!($Prefs.ai?.enabled && $Prefs.ai?.services?.[$Prefs.ai?.selectedService || 'claude']?.apiKey)
  )
  let charts = $state.raw<Record<string, ChartConfiguration<'line'>>>({})
  // Changing the key remounts the charts, so they redraw after each refresh
  let chartKey = $state(0)

  let frozen = $derived(experiment?.status !== 'running')
  let shownResult = $derived(frozen ? experiment?.result : liveResult)
  let finishable = $derived(daysSoFar >= (experiment?.durationDays ?? Infinity))
  let progress = $derived(
    experiment ? (frozen ? 1 : Math.min(1, daysSoFar / experiment.durationDays)) : 0
  )
  let statusLabel = $derived(
    !experiment
      ? ''
      : frozen
        ? experiment.status === 'stopped'
          ? 'Stopped early'
          : 'Finished'
        : `Day ${Math.min(daysSoFar, experiment.durationDays)} of ${experiment.durationDays}`
  )

  const refresh = async () => {
    if (!experiment) return
    const input = await loadResultInput(experiment, $TrackableStore.trackables)
    const days = experimentDaysSoFar(experiment.start, experiment.durationDays, input.today)
    const baselineDays = baselineDaysBefore(experiment.start, experiment.baselineDays ?? experiment.durationDays)
    // Charts are built for finished experiments too, so they can show the before and during days
    // The averages come from the same stats as the cards, so the lines match the numbers
    const snapshot = frozen ? experiment.result : computeResult(input)
    charts = Object.fromEntries(
      experiment.outcomes.map((o) => {
        const stats = snapshot?.outcomes.find((s) => s.tag === o.tag)
        const averages = {
          before: stats && stats.nB > 0 ? stats.meanB : undefined,
          during: stats && stats.nE > 0 ? stats.meanE : undefined,
        }
        return [o.tag, outcomeChartConfig(baselineDays, days, input.outcomeValues[o.tag] || {}, averages)]
      })
    )
    chartKey += 1
    if (frozen) return
    liveResult = computeResult(input)
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

  const offerToRemoveFromBoards = async (adherenceTag: string) => {
    const remove = await Interact.confirm(
      'Remove the check-in tracker from your boards?',
      'The tracker and its logs are kept. Only its place on your boards is removed.',
      'Remove from boards',
      'Keep on boards'
    )
    if (remove) await removeCheckInFromBoards(adherenceTag)
  }

  const finish = async (status: 'completed' | 'stopped') => {
    if (!experiment || busy) return
    const question = status === 'completed' ? 'Finish this experiment?' : 'Stop this experiment early?'
    const confirmed = await Interact.confirm(
      question,
      'The result is saved as it is now, and a summary is written to your journal.'
    )
    if (!confirmed) return
    busy = true
    try {
      const adherenceTag = experiment.adherenceTag
      await endExperiment(experiment, status, $TrackableStore.trackables)
      showToast({ message: status === 'completed' ? 'Experiment finished' : 'Experiment stopped' })
      await offerToRemoveFromBoards(adherenceTag)
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
    const adherenceTag = experiment.adherenceTag
    await ExperimentStore.remove(experiment)
    await offerToRemoveFromBoards(adherenceTag)
    closeModal(id)
  }

  // Drop the focus ring after a tap, so no blue box stays on the eye. Keyboard focus is unaffected.
  const tapEye = (event: MouseEvent) => {
    ;(event.currentTarget as HTMLElement | null)?.blur()
    explainResult()
  }

  // The explanation is shown in four lines, with Read more when it does not fit
  let explanationEl = $state<HTMLElement | undefined>(undefined)
  let expanded = $state(false)
  let overflowing = $state(false)
  const clampStyle = 'display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;'
  $effect(() => {
    const el = explanationEl
    // Measure again when the text changes or the card is redrawn
    experiment?.explanation
    if (el && !expanded) overflowing = el.scrollHeight > el.clientHeight + 1
  })

  // Drop the focus ring after a tap, so no blue box stays on the button
  const toggleExpanded = (event: MouseEvent) => {
    ;(event.currentTarget as HTMLElement | null)?.blur()
    expanded = !expanded
  }

  const explainResult = async () => {
    if (!experiment?.result || explaining) return
    explaining = true
    try {
      const labels: Record<string, string> = {}
      Object.values($TrackableStore.trackables).forEach((t: any) => {
        if (t.tracker?.tag) labels[t.tracker.tag] = t.label
      })
      const response = await query<string>({
        profile: 'experiment',
        prompt: buildExperimentExplainPrompt(experiment, labels),
      })
      await ExperimentStore.upsert(serializeExperiment({ ...experiment, explanation: response.content }))
    } catch (e) {
      Interact.error(e.message)
    } finally {
      explaining = false
    }
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
      <!-- Status -->
      <section class="ios-card p-4 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <ExperimentChip tone={frozen ? 'neutral' : 'running'} label={statusLabel} />
          <div class="text-xs text-gray-500 dark:text-gray-400">{experiment.durationDays} days</div>
        </div>
        {#if experiment.change && experiment.change !== experiment.title}
          <div class="text-sm">{experiment.change}</div>
        {/if}
        <ExperimentProgress value={progress} />

        {#if shownResult}
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="ios-box-good p-2">
              <div class="text-lg font-semibold text-green-700 dark:text-green-300">{shownResult.adherence.kept}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Kept to it</div>
            </div>
            <div class="ios-box p-2">
              <div class="text-lg font-semibold">{shownResult.adherence.missed}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Didn't</div>
            </div>
            <div class="ios-box p-2">
              <div class="text-lg font-semibold">{shownResult.adherence.unchecked}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">Not checked</div>
            </div>
          </div>
        {/if}
      </section>

      <!-- Check-ins -->
      {#if !frozen && uncheckedDays.length}
        <section class="ios-card p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Check in</div>
          <div class="font-semibold mb-2">Did you stick to it?</div>
          {#each uncheckedDays as day}
            <div class="flex items-center justify-between gap-2 py-2 border-t border-gray-100 dark:border-gray-700">
              <span class="text-sm">{dayLabel(day)}</span>
              <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-full bg-primary-500 text-white text-sm font-medium disabled:opacity-50" disabled={busy} onclick={() => checkIn(day, true)}>Kept to it</button>
                <button class="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium disabled:opacity-50" disabled={busy} onclick={() => checkIn(day, false)}>Didn't</button>
              </div>
            </div>
          {/each}
        </section>
      {/if}

      <!-- Outcomes -->
      {#if shownResult}
        {#each shownResult.outcomes as outcome}
          <section class="ios-card p-4 space-y-3">
            <div class="flex items-center justify-between gap-2 min-w-0">
              <div class="font-semibold capitalize truncate">{outcome.tag.replace(/_/g, ' ')}</div>
              <ExperimentChip tone={outcomeTone(outcome.verdict, outcome.matchesExpectation)} label={verdictText(outcome)} title={verdictText(outcome)} />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="ios-box p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Before</div>
                <div class="text-lg font-semibold">{outcome.meanB.toFixed(1)}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{outcome.nB} days</div>
              </div>
              <div class="ios-box-tint p-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">During</div>
                <div class="text-lg font-semibold">
                  {outcome.meanE.toFixed(1)}
                  {#if outcome.pct !== undefined}
                    <span class="text-xs font-medium {outcome.pct >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}">{outcome.pct > 0 ? '+' : ''}{outcome.pct.toFixed(0)}%</span>
                  {/if}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{outcome.nE} days</div>
              </div>
            </div>
            {#if charts[outcome.tag]}
              {#key chartKey}
                <div class="h-44">
                  <Chartjs id="experiment-chart-{outcome.tag}" chartjsPayload={charts[outcome.tag]} />
                </div>
              {/key}
            {/if}
          </section>
        {/each}
        <div class="ios-box p-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{CAVEAT}</div>
      {/if}

      <!-- AI explanation: full mode with AI set up, only once the result is frozen -->
      {#if frozen && shownResult && $FeatureVisible('ai') && aiReady}
        <section class="ios-card p-4 space-y-3">
          <div class="flex items-center gap-3">
            <NomieAiButton size="44px" label="Explain this result" onclick={tapEye} />
            <div class="min-w-0">
              <div class="font-semibold">AI explanation</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {#if explaining}
                  Reading the result…
                {:else if experiment.explanation}
                  Tap the eye to explain it again
                {:else}
                  Tap the eye to explain this result in plain words
                {/if}
              </div>
            </div>
          </div>

          {#if experiment.explanation}
            <div>
              <blockquote
                bind:this={explanationEl}
                class="text-sm leading-relaxed border-l-4 border-primary-500 pl-3 text-gray-700 dark:text-gray-200"
                style={expanded ? '' : clampStyle}
              >
                {experiment.explanation}
              </blockquote>
              {#if overflowing || expanded}
                <button class="mt-2 text-sm font-medium text-primary-500" onclick={toggleExpanded}>
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              {/if}
            </div>
          {/if}

          <div class="text-xs text-gray-500 dark:text-gray-400">
            The numbers and verdicts come from the statistics above. The AI only explains them.
          </div>
        </section>
      {/if}

      <!-- Actions -->
      <div class="space-y-2 pt-2">
        {#if !frozen}
          {#if finishable}
            <Button block primary disabled={busy} on:click={() => finish('completed')}>Finish experiment</Button>
          {/if}
          <Button block clear disabled={busy} on:click={() => finish('stopped')}>Stop early</Button>
        {/if}
        <Button block clear className="text-red-500" on:click={deleteExperiment}>Delete experiment</Button>
      </div>
    {:else}
      <div class="text-gray-500">This experiment could not be found.</div>
    {/if}
  </main>
</BackdropModal>
