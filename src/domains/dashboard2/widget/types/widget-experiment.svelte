<svelte:options runes={true} />

<script lang="ts">
  import type { WidgetClass } from '../widget-class'
  import type { ExperimentResultSnapshot, ExperimentType } from '../../../experiments/experiment-class'
  import { ExperimentStore } from '../../../experiments/ExperimentStore'
  import { TrackableStore } from '../../../trackable/TrackableStore'
  import { loadResultInput } from '../../../experiments/experiment-live'
  import { computeResult, experimentDaysSoFar } from '../../../experiments/experiment-result'
  import { experimentWidgetView } from '../../../experiments/experiment-widget-lines'
  import ExperimentProgress from '../../../experiments/experiment-progress.svelte'
  import ExperimentChip from '../../../experiments/experiment-chip.svelte'

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

<div class="w-full h-full flex flex-col justify-center gap-2 px-4 py-2 overflow-hidden text-gray-800 dark:text-gray-200">
  {#if view}
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-base">🧪</div>
      <div class="min-w-0">
        <div class="font-semibold text-sm truncate">{view.title}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{view.status}</div>
      </div>
    </div>

    <ExperimentProgress value={view.progress} />

    {#if view.adherence}
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Kept to it <span class="font-semibold text-gray-800 dark:text-gray-200">{view.adherence.kept}</span> of {view.adherence.total} days
      </div>
    {/if}

    {#if view.outcomes.length}
      <div class="flex flex-wrap gap-1">
        {#each view.outcomes as outcome}
          <ExperimentChip tone={outcome.tone} label="{outcome.label}: {outcome.text}" title={outcome.text} />
        {/each}
      </div>
    {/if}
  {:else}
    <div class="text-xs text-gray-500">Experiment not found</div>
  {/if}
</div>
