<svelte:options runes={true} />

<script lang="ts">
  import type { WidgetClass } from '../widget-class'
  import type { ExperimentResultSnapshot, ExperimentType } from '../../../experiments/experiment-class'
  import { ExperimentStore } from '../../../experiments/ExperimentStore'
  import IonIcon from '../../../../components/icon/ion-icon.svelte'
  import { FlaskOutline } from '../../../../components/icon/nicons'
  import { TrackableStore } from '../../../trackable/TrackableStore'
  import { loadResultInput } from '../../../experiments/experiment-live'
  import { computeResult, experimentDaysSoFar } from '../../../experiments/experiment-result'
  import { experimentWidgetView } from '../../../experiments/experiment-widget-lines'
  import ExperimentProgress from '../../../experiments/experiment-progress.svelte'
  import ExperimentChip from '../../../experiments/experiment-chip.svelte'
  import { Lang } from '../../../../store/lang'

  const { widget = $bindable() }: { widget: WidgetClass } = $props()

  let experiment = $derived(
    ($ExperimentStore as Array<any>).find((e) => e.id === widget.data?.experimentId) as ExperimentType | undefined
  )
  let liveResult = $state<ExperimentResultSnapshot | undefined>(undefined)
  let daysSoFar = $state(0)

  let view = $derived(
    experiment
      ? experimentWidgetView(experiment, experiment.status === 'running' ? liveResult : experiment.result, daysSoFar)
      : undefined
  )

  $effect(() => {
    const current = experiment
    if (!current || current.status !== 'running') return
    loadResultInput(current, $TrackableStore.trackables)
      .then((input) => {
        liveResult = computeResult(input)
        daysSoFar = experimentDaysSoFar(current.start, current.durationDays, input.today).length
      })
      .catch((e) => console.error(e))
  })
</script>

<div class="w-full h-full flex flex-col justify-center gap-2 px-4 py-2 overflow-hidden text-ios-label">
  {#if view}
    <!-- iOS look (guide 5.7): 34 px tint square, 15 px title, 13 px status -->
    <div class="flex items-center gap-2 min-w-0">
      <div class="ios-exp-icon flex-shrink-0 flex items-center justify-center text-ios-tint">
        <IonIcon icon={FlaskOutline} size={18} />
      </div>
      <div class="min-w-0">
        <div class="text-ios-subhead font-semibold truncate">{view.title}</div>
        <div class="text-ios-footnote text-ios-label2">{view.status}</div>
      </div>
    </div>

    <ExperimentProgress value={view.progress} />

    {#if view.adherence}
      <div class="text-ios-footnote text-ios-label2">
        {Lang.t('dashboard.kept-to-it', 'Kept to it')}
        <span class="font-semibold text-ios-label">{view.adherence.kept}</span>
        {Lang.t('dashboard.of-days', { total: view.adherence.total })}
      </div>
    {/if}

    {#if view.outcomes.length}
      <!-- iOS look (guide 0 rule 1): the verdict wraps; it is not cut off -->
      <div class="flex flex-wrap gap-1 outcome-chips">
        {#each view.outcomes as outcome}
          <ExperimentChip tone={outcome.tone} label="{outcome.label}: {outcome.text}" title={outcome.text} />
        {/each}
      </div>
    {/if}
  {:else}
    <div class="text-ios-footnote text-ios-label2">
      {Lang.t('dashboard.experiment-not-found', 'Experiment not found')}
    </div>
  {/if}
</div>

<style>
  .outcome-chips :global(.chip) {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    max-width: 100%;
    line-height: 1.3;
    padding: 4px 9px;
  }
  /* iOS look: 34 px square in the tint-soft colour */
  .ios-exp-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--ios-tint-soft);
    font-size: 17px;
  }
</style>
