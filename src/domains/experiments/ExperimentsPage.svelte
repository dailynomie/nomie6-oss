<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import Layout from '../layout/layout.svelte'
  import List from '../../components/list/list.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { Lang } from '../../store/lang'
  import { AddIcon, FlaskOutline } from '../../components/icon/nicons'
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
  <header slot="header" class="glass z-50 px-4 pt-1 pb-1">
    <!-- on desktop the header sits in the same centred column as the list -->
    <div class="ios-desktop-column">
      <!-- iOS look: the add action is on the trailing side of the action row -->
      <div class="flex items-center justify-end h-9">
        <button
          type="button"
          aria-label={Lang.t('experiments.new-experiment', 'New experiment')}
          class="exp-round"
          on:click={openEditor}
        >
          <IonIcon icon={AddIcon} size={18} />
        </button>
      </div>
      <h1 class="text-ios-large font-bold text-ios-label outline-none">{Lang.t('experiments.title', 'Experiments')}</h1>
      <p class="text-ios-subhead text-ios-label2">
        {Lang.t('experiments.test-one-change-see-what-it-does', 'Test one change. See what it does.')}
      </p>
      {#if $ExperimentStore.length}
        <p class="text-ios-footnote text-ios-label2 mt-1">
          {Lang.t('experiments.running-finished', { running: running.length, finished: finished.length })}
        </p>
      {/if}
    </div>
  </header>
  <main class="py-4 relative z-10 px-2 lg:px-4">
    {#if $ExperimentStore.length === 0}
      <List transparent className="max-w-md mx-auto">
        <Empty icon={FlaskOutline} title={Lang.t('experiments.no-experiments-yet', 'No experiments yet')}>
          <div class="text-center px-6 text-ios-label2">
            {Lang.t(
              'experiments.test-whether-one-change-such-as-no-coffee-after-',
              'Test whether one change, such as no coffee after 14:00, affects something you track.'
            )}
          </div>
        </Empty>
      </List>
    {:else}
      <div class="mb-4">
        <ButtonGroup
          bind:value={view}
          className="max-w-sm mx-auto"
          buttons={[
            { label: Lang.t('experiments.running', 'Running'), value: 'running' },
            { label: Lang.t('experiments.finished', 'Finished'), value: 'finished' },
          ]}
        />
      </div>
      {#if view === 'running' && running.length}
        <List solo className="max-w-screen-lg mx-auto mb-4">
          {#each running as experiment (experiment.id)}
            {@const day = dayReached(experiment.start, experiment.durationDays)}
            <ListItem clickable detail bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="w-full py-1 space-y-2">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <div class="font-semibold truncate">{experiment.title}</div>
                  <ExperimentChip
                    tone="running"
                    label={Lang.t('experiments.day-of', { day, total: experiment.durationDays })}
                  />
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
            {@const summary = experimentWidgetView(experiment, experiment.result, 0)}
            <ListItem clickable detail bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="w-full py-1 space-y-2">
                <div class="flex items-center justify-between gap-2 min-w-0">
                  <div class="font-semibold truncate">{experiment.title}</div>
                  <!-- iOS look (section 0 rule 1): the status chip keeps its full text -->
                  <div class="shrink-0">
                    <ExperimentChip
                      tone="neutral"
                      label={experiment.status === 'stopped'
                        ? Lang.t('experiments.stopped-early', 'Stopped early')
                        : Lang.t('experiments.finished', 'Finished')}
                    />
                  </div>
                </div>
                {#if summary.outcomes.length}
                  <!-- iOS look (guide 5.5): one chip per outcome, in its own tone -->
                  <div class="finished-outcome flex flex-wrap gap-1">
                    {#each summary.outcomes as outcome}
                      <ExperimentChip
                        tone={outcome.tone}
                        label="{outcome.label}: {outcome.text}"
                        title={outcome.text}
                      />
                    {/each}
                  </div>
                {/if}
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
      {#if view === 'running' && !running.length}
        <!-- iOS look: the same empty state as the page, with its icon -->
        <Empty icon={FlaskOutline} title={Lang.t('experiments.no-running-experiments', 'No running experiments')} />
      {/if}
      {#if view === 'finished' && !finished.length}
        <Empty
          icon={FlaskOutline}
          title={Lang.t('experiments.no-finished-experiments-yet', 'No finished experiments yet')}
        />
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
  .finished-outcome :global(.chip) {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    max-width: 100%;
    line-height: 1.3;
    padding: 4px 9px;
  }
</style>
