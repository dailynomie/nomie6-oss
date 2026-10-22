<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import FeatureBadge from '../../components/advanced-badge/feature-badge.svelte'
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
  import { Lang } from '../../store/lang'

  const { id, experimentId } = $props()

  let experiment = $derived(
    ($ExperimentStore as Array<any>).find((e) => e.id === experimentId) as ExperimentType | undefined
  )
  // The last day of the experiment, for example "Saturday 24 October"
  let endsText = $derived(
    experiment
      ? dayjs(experiment.start)
          .add(experiment.durationDays - 1, 'day')
          .format('dddd D MMMM')
      : ''
  )
  let liveResult = $state<ExperimentResultSnapshot | undefined>(undefined)
  let uncheckedDays = $state<Array<string>>([])
  let daysSoFar = $state(0)
  let busy = $state(false)
  let explaining = $state(false)
  let aiReady = $derived(
    !!($Prefs.ai?.enabled && $Prefs.ai?.services?.[$Prefs.ai?.selectedService || 'claude']?.apiKey)
  )
  let charts = $state.raw<Record<string, ChartConfiguration<'bar'>>>({})
  // Changing the key remounts the charts, so they redraw after each refresh
  let chartKey = $state(0)

  let frozen = $derived(experiment?.status !== 'running')
  let shownResult = $derived(frozen ? experiment?.result : liveResult)
  let finishable = $derived(daysSoFar >= (experiment?.durationDays ?? Infinity))
  let progress = $derived(experiment ? (frozen ? 1 : Math.min(1, daysSoFar / experiment.durationDays)) : 0)
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
    charts = Object.fromEntries(
      experiment.outcomes.map((o) => [o.tag, outcomeChartConfig(baselineDays, days, input.outcomeValues[o.tag] || {})])
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
      showToast({
        message:
          status === Lang.t('experiments.completed', 'completed')
            ? Lang.t('experiments.experiment-finished', 'Experiment finished')
            : Lang.t('experiments.experiment-stopped', 'Experiment stopped'),
      })
      await offerToRemoveFromBoards(adherenceTag)
    } catch (e) {
      Interact.error(e.message)
    } finally {
      busy = false
    }
  }

  const deleteExperiment = async () => {
    if (!experiment) return
    const confirmed = await Interact.confirm(
      'Delete this experiment?',
      'The experiment is removed. Your check-in logs are kept.'
    )
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
      <div slot="right">
        <Button clear primary on:click={() => closeModal(id)}>{Lang.t('experiments.done', 'Done')}</Button>
      </div>
      <!-- iOS look (guide 5.6): the modal header reads "Experiment"; the title is the large title below -->
      <h2 class="text-ios-body font-semibold text-ios-label">{Lang.t('experiments.experiment', 'Experiment')}</h2>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-ios-label">
    {#if experiment}
      <h1 class="text-ios-title1 font-bold px-1">{experiment.title}</h1>

      <!-- Status -->
      <section class="ios-card p-4 space-y-3">
        <!-- iOS look (guide 5.6): the chip is on the left and the duration and end date on the right, on one line -->
        <div class="flex items-center justify-between gap-3">
          <div class="shrink-0">
            <ExperimentChip tone={frozen ? 'neutral' : 'running'} label={statusLabel} />
          </div>
          <div class="text-ios-footnote text-ios-label2 text-right min-w-0">
            {Lang.t('experiments.days-ends', { days: experiment.durationDays, ends: endsText })}
          </div>
        </div>
        {#if experiment.change && experiment.change !== experiment.title}
          <div class="text-sm">{experiment.change}</div>
        {/if}
        <ExperimentProgress value={progress} />

        {#if shownResult}
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="ios-box-good p-2">
              <div class="text-xl font-bold text-ios-good">{shownResult.adherence.kept}</div>
              <div class="text-ios-caption text-ios-label2">{Lang.t('experiments.kept-to-it', 'Kept to it')}</div>
            </div>
            <div class="ios-box p-2">
              <div class="text-xl font-bold">{shownResult.adherence.missed}</div>
              <div class="text-ios-caption text-ios-label2">{Lang.t('experiments.didn-t', "Didn't")}</div>
            </div>
            <div class="ios-box p-2">
              <div class="text-xl font-bold">{shownResult.adherence.unchecked}</div>
              <div class="text-xs text-ios-label2">{Lang.t('experiments.not-checked', 'Not checked')}</div>
            </div>
          </div>
        {/if}
      </section>

      <!-- Check-ins -->
      {#if !frozen && uncheckedDays.length}
        <section class="ios-card p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-1">
            {Lang.t('experiments.check-in', 'Check in')}
          </div>
          <div class="text-ios-subhead font-semibold mb-2">
            {Lang.t('experiments.did-you-stick-to-it', 'Did you stick to it?')}
          </div>
          {#each uncheckedDays as day}
            <div
              class="flex items-center justify-between gap-2 py-2"
              style="border-top: 0.5px solid var(--ios-separator)"
            >
              <span class="text-ios-subhead">{dayLabel(day)}</span>
              <div class="flex gap-2">
                <button
                  class="h-9 px-3.5 rounded-full bg-ios-tint text-ios-ontint text-ios-subhead font-medium disabled:opacity-50"
                  disabled={busy}
                  onclick={() => checkIn(day, true)}>{Lang.t('experiments.kept-to-it', 'Kept to it')}</button
                >
                <button
                  class="h-9 px-3.5 rounded-full bg-ios-fill text-ios-label text-ios-subhead font-medium disabled:opacity-50"
                  disabled={busy}
                  onclick={() => checkIn(day, false)}>{Lang.t('experiments.didn-t', "Didn't")}</button
                >
              </div>
            </div>
          {/each}
        </section>
      {/if}

      <!-- Outcomes -->
      {#if shownResult}
        {#each shownResult.outcomes as outcome}
          <section class="ios-card p-4 space-y-3">
            <div class="space-y-2 min-w-0">
              <div class="text-ios-body font-semibold capitalize">{outcome.tag.replace(/_/g, ' ')}</div>
              <ExperimentChip
                tone={outcomeTone(outcome.verdict, outcome.matchesExpectation)}
                label={verdictText(outcome)}
                title={verdictText(outcome)}
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="ios-box p-3">
                <div class="text-xs text-ios-label2">{Lang.t('experiments.before', 'Before')}</div>
                <div class="font-bold" style="font-size: 22px; line-height: 26px">{outcome.meanB.toFixed(1)}</div>
                <div class="text-xs text-ios-label2">{Lang.t('experiments.days', { num: outcome.nB })}</div>
              </div>
              <div class="ios-box-tint p-3">
                <div class="text-xs text-ios-label2">{Lang.t('experiments.during', 'During')}</div>
                <div class="font-bold" style="font-size: 22px; line-height: 26px">
                  {outcome.meanE.toFixed(1)}
                  {#if outcome.pct !== undefined}
                    <span class="text-ios-footnote font-bold {outcome.pct >= 0 ? 'text-ios-good' : 'text-ios-danger'}"
                      >{outcome.pct > 0 ? '+' : ''}{outcome.pct.toFixed(0)}%</span
                    >
                  {/if}
                </div>
                <div class="text-xs text-ios-label2">{Lang.t('experiments.days', { num: outcome.nE })}</div>
              </div>
            </div>
            {#if charts[outcome.tag]}
              <!-- iOS look (guide 5.6): one bar per day, 64 px high, with the Before and During captions -->
              <div class="flex justify-between text-ios-caption font-semibold mt-2">
                <span class="text-ios-label2">{Lang.t('experiments.before', 'Before')}</span>
                <span class="text-ios-tint">{Lang.t('experiments.during', 'During')}</span>
              </div>
              {#key chartKey}
                <div class="h-16">
                  <Chartjs id="experiment-chart-{outcome.tag}" chartjsPayload={charts[outcome.tag]} />
                </div>
              {/key}
            {/if}
          </section>
        {/each}
        <!-- iOS look: the caveat is plain text with a 4 px inset, not a card -->
        <div class="px-1 text-ios-caption text-ios-label2">{CAVEAT}</div>
      {/if}

      <!-- AI explanation: full mode with AI set up, only once the result is frozen -->
      {#if frozen && shownResult && $FeatureVisible('ai') && aiReady}
        <section class="relative ios-card p-4 space-y-3">
          <FeatureBadge feature="ai" />
          <div class="flex items-center gap-3">
            <NomieAiButton
              size="44px"
              label={Lang.t('experiments.explain-this-result', 'Explain this result')}
              onclick={tapEye}
            />
            <div class="min-w-0">
              <div class="font-semibold">{Lang.t('experiments.ai-explanation', 'AI explanation')}</div>
              <div class="text-xs text-ios-label2">
                {#if explaining}
                  {Lang.t('experiments.reading-result', 'Reading the result…')}
                {:else if experiment.explanation}
                  {Lang.t('experiments.tap-to-explain', 'Tap the eye to explain it again')}
                {:else}
                  {Lang.t('experiments.explain-result', 'Tap the eye to explain this result in plain words')}
                {/if}
              </div>
            </div>
          </div>

          {#if experiment.explanation}
            <div>
              <blockquote
                bind:this={explanationEl}
                class="text-sm leading-relaxed border-l-4 border-ios-tint pl-3 text-ios-label"
                style={expanded ? '' : clampStyle}
              >
                {experiment.explanation}
              </blockquote>
              {#if overflowing || expanded}
                <button class="mt-2 text-sm font-medium text-ios-tint" onclick={toggleExpanded}>
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              {/if}
            </div>
          {/if}

          <div class="text-xs text-ios-label2">
            {Lang.t(
              'experiments.the-numbers-and-verdicts-come-from-the-statistic',
              'The numbers and verdicts come from the statistics above. The AI only explains them.'
            )}
          </div>
        </section>
      {/if}

      <!-- Actions: one grouped card of 48 px rows -->
      <div class="ios-card overflow-hidden mt-2">
        {#if !frozen}
          {#if finishable}
            <button class="ios-action font-semibold text-ios-tint" disabled={busy} onclick={() => finish('completed')}
              >{Lang.t('experiments.finish-experiment', 'Finish experiment')}</button
            >
          {/if}
          <button class="ios-action text-ios-tint" disabled={busy} onclick={() => finish('stopped')}
            >{Lang.t('experiments.stop-early', 'Stop early')}</button
          >
        {/if}
        <button class="ios-action text-ios-danger" disabled={busy} onclick={deleteExperiment}
          >{Lang.t('experiments.delete-experiment', 'Delete experiment')}</button
        >
      </div>
    {:else}
      <div class="text-ios-label2">
        {Lang.t('experiments.this-experiment-could-not-be-found', 'This experiment could not be found.')}
      </div>
    {/if}
  </main>
</BackdropModal>

<style>
  /* iOS look: a 48 px row in the grouped action card (guide 5.6) */
  .ios-action {
    display: block;
    width: 100%;
    height: 48px;
    font-size: 17px;
    line-height: 22px;
    text-align: center;
    background: transparent;
  }
  .ios-action + .ios-action {
    border-top: 0.5px solid var(--ios-separator);
  }
  .ios-action:disabled {
    opacity: 0.5;
  }
</style>
