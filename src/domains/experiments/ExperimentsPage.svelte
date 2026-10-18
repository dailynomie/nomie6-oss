<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import Layout from '../layout/layout.svelte'
  import List from '../../components/list/list.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import { Lang } from '../../store/lang'
  import { PulseOutline } from '../../components/icon/nicons'
  import { ExperimentStore } from './ExperimentStore'
  import Button from '../../components/button/button.svelte'
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

  let running = $derived($ExperimentStore.filter((e: any) => e.status === 'running'))
  let finished = $derived($ExperimentStore.filter((e: any) => e.status !== 'running'))
</script>

<Layout pageTitle={Lang.t('experiments.title', 'Experiments')}>
  <header slot="header" class="glass z-50">
    <ToolbarGrid>
      <div slot="left"></div>
      <h1 class="ntitle outline-none focus:ring-none">{Lang.t('experiments.title', 'Experiments')}</h1>
      <div slot="right">
        <Button clear primary on:click={openEditor}>New</Button>
      </div>
    </ToolbarGrid>
  </header>
  <main class="py-4 relative z-10 px-2 lg:px-4">
    {#if $ExperimentStore.length === 0}
      <List transparent className="max-w-md mx-auto">
        <Empty icon={PulseOutline} title="No experiments yet">
          <div class="text-center px-6 text-gray-500">
            Test whether one change, such as no coffee after 14:00, affects something you track.
          </div>
        </Empty>
      </List>
    {:else}
      {#if running.length}
        <List solo title="Running" className="max-w-screen-lg mx-auto">
          {#each running as experiment (experiment.id)}
            <ListItem clickable bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="font-semibold">{experiment.title}</div>
              <div class="text-xs text-gray-500">
                Day {dayReached(experiment.start, experiment.durationDays)} of {experiment.durationDays}
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
      {#if finished.length}
        <List solo title="Finished" className="max-w-screen-lg mx-auto">
          {#each finished as experiment (experiment.id)}
            <ListItem clickable bottomLine={16} on:click={() => openDetail(experiment.id)}>
              <div class="font-semibold">{experiment.title}</div>
              <div class="text-xs text-gray-500">
                {experiment.status === 'stopped' ? 'Stopped early' : 'Finished'}
              </div>
            </ListItem>
          {/each}
        </List>
      {/if}
    {/if}
  </main>
</Layout>
