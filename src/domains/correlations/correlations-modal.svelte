<svelte:options runes={true} />

<script lang="ts">
  // I1 (Find links): two trackers, and the links the code finds between them in the last 90 days.
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal, openModal } from '../../components/backdrop/BackdropStore2'
  import { selectTrackable } from '../trackable/trackable-selector/TrackableSelectorStore'
  import { TrackableStore } from '../trackable/TrackableStore'
  import ExperimentEditorModal from '../experiments/experiment-editor-modal.svelte'
  import { Lang } from '../../store/lang'
  import { findLinks, type Link } from './link-finder'
  import { loadPair, WINDOW_DAYS } from './correlations-query'

  const { id } = $props()

  let first = $state<any>(undefined)
  let second = $state<any>(undefined)
  let links = $state<Array<Link>>([])
  let searched = $state(false)
  let busy = $state(false)

  const sameTracker = $derived(!!first && !!second && first.tracker?.tag === second.tracker?.tag)
  const canLook = $derived(!!first && !!second && !sameTracker && !busy)

  const pick = async (which: 'first' | 'second') => {
    const trackable: any = await selectTrackable('tracker')
    if (!trackable) return
    if (which === 'first') first = trackable
    else second = trackable
    searched = false
  }

  const look = async () => {
    if (!canLook) return
    busy = true
    const { a, b } = await loadPair(first.tracker.tag, second.tracker.tag, $TrackableStore.trackables)
    links = findLinks(a, b)
    searched = true
    busy = false
  }

  const sentence = (link: Link): string => {
    const direction = Lang.t(`correlations.${link.direction}`)
    const values = { a: first.label, b: second.label, direction, matches: link.matches, total: link.total }
    return link.lag === 1
      ? Lang.t('correlations.next-day', values)
      : Lang.t('correlations.same-day', values)
  }

  // A link suggests the opposite change: if B is lower after high A, the experiment hopes B goes up when A goes down.
  const startExperiment = (link: Link) => {
    openModal({
      id: 'experiment-editor',
      position: 'fullscreen',
      component: ExperimentEditorModal,
      componentProps: {
        prefill: {
          title: Lang.t('correlations.experiment-title', { name: first.label }),
          outcomes: [
            { tag: second.tracker.tag, label: second.label, direction: link.direction === 'lower' ? 'up' : 'down' },
          ],
        },
      },
    })
    closeModal(id)
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>{Lang.t('correlations.close', 'Close')}</Button>
      </div>
      <h2 class="ntitle">{Lang.t('correlations.title', 'Find links')}</h2>
      <div slot="right"></div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-ios-label">
    <p class="text-sm text-ios-label2">
      {Lang.t('correlations.intro', { days: WINDOW_DAYS })}
    </p>

    <section class="ios-card divide-y divide-ios-separator">
      <button type="button" class="w-full flex justify-between p-4 text-left" on:click={() => pick('first')}>
        <span>{Lang.t('correlations.first', 'First tracker')}</span>
        <span class="text-ios-tint">{first?.label ?? Lang.t('correlations.choose', 'Choose a tracker')}</span>
      </button>
      <button type="button" class="w-full flex justify-between p-4 text-left" on:click={() => pick('second')}>
        <span>{Lang.t('correlations.second', 'Second tracker')}</span>
        <span class="text-ios-tint">{second?.label ?? Lang.t('correlations.choose', 'Choose a tracker')}</span>
      </button>
    </section>

    {#if sameTracker}
      <p class="text-sm text-ios-danger">{Lang.t('correlations.same-tracker', 'Choose two different trackers.')}</p>
    {/if}

    <Button block primary disabled={!canLook} on:click={look}>{Lang.t('correlations.look', 'Look for links')}</Button>

    {#if searched}
      {#if links.length === 0}
        <p class="p-4 ios-card text-sm text-ios-label2">{Lang.t('correlations.none', { days: WINDOW_DAYS })}</p>
      {:else}
        {#each links as link}
          <section class="p-4 ios-card space-y-3">
            <p class="leading-relaxed">{sentence(link)}</p>
            <Button block clear primary on:click={() => startExperiment(link)}>
              {Lang.t('correlations.start-experiment', 'Start an experiment on this')}
            </Button>
          </section>
        {/each}
      {/if}
    {/if}
  </main>
</BackdropModal>
