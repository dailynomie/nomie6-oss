<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'
  import { ExperimentStore } from './ExperimentStore'
  import { DAY_FORMAT } from './experiment-data'
  import { BackdropStore2 } from '../../components/backdrop/BackdropStore2'
  import { loadDailyValues } from './experiment-query'
  import { recordCheckIn } from './experiment-live'
  import { TrackableStore } from '../trackable/TrackableStore'
  import type { ExperimentType } from './experiment-class'
  import { RadialOpenStore } from '../layout/radial-store'
  import { MenuBlockerStore } from '../../components/menu/useDropmenu'

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
      const last = dayjs(experiment.start)
        .add(experiment.durationDays - 1, 'day')
        .format(DAY_FORMAT)
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

{#if pending.length && !$BackdropStore2.length && !$RadialOpenStore && !$MenuBlockerStore}
  <div
    use:toBody
    class="experiment-check-in-card fixed bottom-52 lg:bottom-6 left-3 right-3 lg:left-auto lg:w-96 space-y-2"
    style="z-index: 9999"
  >
    {#each pending as experiment (experiment.id)}
      <!-- iOS look (guide 5.4): 18 px radius, 12 px caption, 15 px question, two 44 px buttons -->
      <div class="ios-card ios-float p-4 space-y-3" style="border-radius: 18px">
        <div class="text-xs font-semibold uppercase text-ios-label2" style="letter-spacing: 0.4px">
          {Lang.t('experiments.today-s-check-in', "Today's check-in")}
        </div>
        <div class="text-ios-subhead">
          {Lang.t('experiments.did-you-stick-to', 'Did you stick to')}
          <span class="font-semibold">{experiment.title}</span>?
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="h-11 rounded-xl bg-ios-tint text-ios-ontint text-ios-subhead font-medium disabled:opacity-50"
            disabled={busy}
            onclick={() => answer(experiment, true)}>{Lang.t('experiments.kept-to-it', 'Kept to it')}</button
          >
          <button
            class="h-11 rounded-xl bg-ios-fill text-ios-label text-ios-subhead font-medium disabled:opacity-50"
            disabled={busy}
            onclick={() => answer(experiment, false)}>{Lang.t('experiments.didn-t', "Didn't")}</button
          >
        </div>
      </div>
    {/each}
  </div>
{/if}
