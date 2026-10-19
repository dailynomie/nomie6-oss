<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import Layout from '../layout/layout.svelte'
  import List from '../../components/list/list.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { Lang } from '../../store/lang'
  import { AddIcon, PulseOutline } from '../../components/icon/nicons'
  import { ExperimentStore } from './ExperimentStore'
  import { experimentWidgetView } from './experiment-widget-lines'
  import ExperimentProgress from './experiment-progress.svelte'
  import ExperimentChip from './experiment-chip.svelte'
  import ButtonGroup from '../../components/button-group/button-group.svelte'
  import { openModal } from '../../components/backdrop/BackdropStore2'
  import ExperimentEditorModal from './experiment-editor-modal.svelte'
  import ExperimentDetailModal from './experiment-detail-modal.svelte'

  const openDetail = (experimentId: string) => {
    openModal({
      id: `experiment-${experimentId}-detail`,
      position: 'fullscreen',
      component: ExperimentDetailModal,
      componentProps: { experimentId },
    })
  }

  const openEditor = () => {
    openModal({
      id: 'experiment-editor',
      position: 'fullscreen',
      component: ExperimentEditorModal,
      componentProps: {},
    })
  }

  // Days so far, counted from the start day, capped at the experiment length
  const dayReached = (start: string, durationDays: number): number => {
    const elapsed = dayjs().diff(dayjs(start), 'day') + 1
    return Math.min(durationDays, Math.max(0, elapsed))
  }

  let view = $state<'running' | 'finished'>('running')

  let running = $derived($ExperimentStore.filter((e: any) => e.status === 'running'))
  let finished = $derived($ExperimentStore.filter((e: any) => e.status !== 'running'))
</script>

<Layout pageTitle={Lang.t('experiments.title', 'Experiments')}>
  <!-- Same header as My Goals: round add button, large title, subtitle -->
  <header slot="header" class="glass z-50 px-4 pt-2 pb-3">
    <div class="flex items-center justify-between h-11">
      <button type="button" aria-label="New experiment" class="exp-round" on:click={openEditor}>
        <IonIcon icon={AddIcon} size={18} />
      </button>
    </div>
    <h1 class="text-ios-large font-bold text-ios-label mt-1 outline-none">{Lang.t('experiments.title', 'Experiments')}</h1>
    <p class="text-ios-subhead text-ios-label2">Test one change. See what it does.</p>
    {#if $ExperimentStore.length}
      <p class="text-ios-footnote text-ios-label2 mt-1">{running.length} running · {finished.length} finished</p>
    {/if}
  </header>
  <main class="py-4 relative z-10 px-2 lg:px-4">
    {#if $ExperimentStore.length === 0}
      <List transparent className="max-w-md mx-auto">
        <Empty icon={PulseOutline} title="No experiments yet">
          <div class="text-center px-6 text-ios-label2">
            Test whether one change, such as no coffee after 14:00, affects something you track.
          </div>
        </Empty>
      </List>
    {:else}
      <div class="mb-4">
        <ButtonGroup
          bind:value={view}
          className="max-w-sm mx-auto"
          buttons={[
            { label: 'Running', value: 'running' },
            { label: 'Finished', value: 'finished' },
          ]}
        />
      </div>
      {#if view === 'running' && running.length}
        <List solo className="max-w-screen-lg mx-auto mb-4">
          {#each running as experiment (experiment.id)}
            {@const day = dayReached(experiment.start, experiment.durationDays)}
            <ListItem clickable bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="w-full py-1 space-y-2">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <div class="font-semibold truncate">{experiment.title}</div>
                  <ExperimentChip tone="running" label="Day {day} of {experiment.durationDays}" />
                </div>
                <ExperimentProgress value={day / experiment.durationDays} />
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
      {#if view === 'finished' && finished.length}
        <List solo className="max-w-screen-lg mx-auto">
          {#each finished as experiment (experiment.id)}
            {@const view = experimentWidgetView(experiment, experiment.result, 0)}
            {@const first = view.outcomes[0]}
            <ListItem clickable bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="w-full py-1 space-y-2">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <div class="font-semibold truncate">{experiment.title}</div>
                  <ExperimentChip tone="neutral" label={experiment.status === 'stopped' ? 'Stopped early' : 'Finished'} />
                </div>
                {#if first}
                  <ExperimentChip tone={first.tone} label="{first.label}: {first.text}" title={first.text} />
                {/if}
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
      {#if view === 'running' && !running.length}
        <div class="text-center text-ios-label2 py-8">No running experiments</div>
      {/if}
      {#if view === 'finished' && !finished.length}
        <div class="text-center text-ios-label2 py-8">No finished experiments yet</div>
      {/if}
    {/if}
  </main>
</Layout>

<style>
  /* iOS look: round add button, as on My Goals */
  .exp-round {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ios-fill);
    color: var(--ios-label);
  }
</style>
