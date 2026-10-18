<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'
  import { ExperimentStore } from './ExperimentStore'
  import { DAY_FORMAT } from './experiment-data'
  import { loadDailyValues } from './experiment-query'
  import { recordCheckIn } from './experiment-live'
  import { TrackableStore } from '../trackable/TrackableStore'
  import type { ExperimentType } from './experiment-class'

  // Move the card to the top of the page, so it is not held back by the page's own layers
  const toBody = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      },
    }
  }

  let pending = $state<Array<ExperimentType>>([])
  let busy = $state(false)

  const load = async () => {
    const today = dayjs().startOf('day')
    const todayText = today.format(DAY_FORMAT)
    const found: Array<ExperimentType> = []
    for (const experiment of ($ExperimentStore as Array<any>).filter((e) => e.status === 'running')) {
      const last = dayjs(experiment.start).add(experiment.durationDays - 1, 'day').format(DAY_FORMAT)
      if (todayText < experiment.start || todayText > last) continue
      const values = await loadDailyValues(experiment.adherenceTag, today, today, $TrackableStore.trackables)
      if (values[todayText] === undefined) found.push(experiment)
    }
    pending = found
  }

  const answer = async (experiment: ExperimentType, kept: boolean) => {
    if (busy) return
    busy = true
    try {
      await recordCheckIn(experiment, dayjs().format(DAY_FORMAT), kept)
      await load()
    } finally {
      busy = false
    }
  }

  $effect(() => {
    $ExperimentStore
    load()
  })
</script>

{#if pending.length}
  <div use:toBody class="fixed bottom-52 lg:bottom-6 left-3 right-3 lg:left-auto lg:w-96 space-y-2" style="z-index: 9999">
    {#each pending as experiment (experiment.id)}
      <div class="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 space-y-2">
        <div class="text-sm">Today: did you stick to <span class="font-semibold">{experiment.title}</span>?</div>
        <div class="space-x-2">
          <button class="px-3 py-1 rounded-lg bg-primary-500 text-white text-sm" disabled={busy} onclick={() => answer(experiment, true)}>Kept to it</button>
          <button class="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm" disabled={busy} onclick={() => answer(experiment, false)}>Didn't</button>
        </div>
      </div>
    {/each}
  </div>
{/if}
