<svelte:options runes={true} />

<script lang="ts">
  // I1 (Find links): the links the code finds in the background between all trackers, people, contexts and pointers,
  // and a manual pick of two items.
  import { onMount } from 'svelte'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal, openModal } from '../../components/backdrop/BackdropStore2'
  import { selectTrackable } from '../trackable/trackable-selector/TrackableSelectorStore'
  import { TrackableStore } from '../trackable/TrackableStore'
  import ExperimentEditorModal from '../experiments/experiment-editor-modal.svelte'
  import { Lang } from '../../store/lang'
  import { findLinks, type Link } from './link-finder'
  import { loadLinkItems, loadPair, WINDOW_DAYS, type LinkItem } from './correlations-query'
  import { suggestLinks, type Suggestion } from './suggestions'

  const { id } = $props()

  // the background analysis, started when the screen opens
  let suggestions = $state<Array<Suggestion>>([])
  let analysing = $state(true)
  // the section starts collapsed; its header still shows how many there are
  let suggestionsOpen = $state(false)

  // the manual pick
  let first = $state<any>(undefined)
  let second = $state<any>(undefined)
  let links = $state<Array<Link>>([])
  let searched = $state(false)
  let busy = $state(false)

  const sameTracker = $derived(!!first && !!second && first.tracker?.tag === second.tracker?.tag)
  const canLook = $derived(!!first && !!second && !sameTracker && !busy)

  onMount(async () => {
    try {
      const items: Array<LinkItem> = await loadLinkItems($TrackableStore.trackables)
      suggestions = suggestLinks(items)
    } finally {
      analysing = false
    }
  })

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

  const sentence = (link: Link, aLabel: string, bLabel: string): string => {
    const values = {
      a: aLabel,
      b: bLabel,
      direction: Lang.t(`correlations.${link.direction}`),
      matches: link.matches,
      total: link.total,
    }
    return link.lag === 1 ? Lang.t('correlations.next-day', values) : Lang.t('correlations.same-day', values)
  }

  // A link suggests the opposite change: if B is lower after high A, the experiment hopes B goes up when A goes down.
  // An experiment measures trackers, so the outcome must be a tracker.
  const startExperiment = (aLabel: string, bKey: string, bLabel: string, link: Link) => {
    openModal({
      id: 'experiment-editor',
      position: 'fullscreen',
      component: ExperimentEditorModal,
      componentProps: {
        prefill: {
          title: Lang.t('correlations.experiment-title', { name: aLabel }),
          outcomes: [{ tag: bKey.replace(/^#/, ''), label: bLabel, direction: link.direction === 'lower' ? 'up' : 'down' }],
        },
      },
    })
    closeModal(id)
  }

  const startFromPick = (link: Link) => startExperiment(first.label, second.tracker.tag, second.label, link)
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

  <main class="p-4 space-y-5 text-ios-label">
    <p class="text-sm text-ios-label2">{Lang.t('correlations.intro', { days: WINDOW_DAYS })}</p>

    <section class="space-y-3">
      <button
        type="button"
        class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ios-label2"
        aria-expanded={suggestionsOpen}
        on:click={() => (suggestionsOpen = !suggestionsOpen)}
      >
        <span>{Lang.t('correlations.suggested', 'Suggested links')}{analysing ? '' : ` (${suggestions.length})`}</span>
        <span aria-hidden="true">{suggestionsOpen ? '▾' : '▸'}</span>
      </button>
      {#if suggestionsOpen}
      {#if analysing}
        <p class="p-4 ios-card text-sm text-ios-label2">{Lang.t('correlations.analysing', 'Looking for links in the background…')}</p>
      {:else if suggestions.length === 0}
        <p class="p-4 ios-card text-sm text-ios-label2">{Lang.t('correlations.none-suggested', 'No clear links yet. A suggestion needs at least two weeks of days with both items, and three in four days in the same direction.')}</p>
      {:else}
        {#each suggestions as s}
          <section class="p-4 ios-card space-y-3">
            <p class="leading-relaxed">{sentence(s.link, s.a.label, s.b.label)}</p>
            {#if s.b.type === 'tracker'}
              <Button block clear primary on:click={() => startExperiment(s.a.label, s.b.key, s.b.label, s.link)}>
                {Lang.t('correlations.start-experiment', 'Start an experiment on this')}
              </Button>
            {/if}
          </section>
        {/each}
      {/if}
      {/if}
    </section>

    <section class="space-y-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-ios-label2">{Lang.t('correlations.own', 'Or choose two trackers')}</h3>
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
              <p class="leading-relaxed">{sentence(link, first.label, second.label)}</p>
              <Button block clear primary on:click={() => startFromPick(link)}>
                {Lang.t('correlations.start-experiment', 'Start an experiment on this')}
              </Button>
            </section>
          {/each}
        {/if}
      {/if}
    </section>
  </main>
</BackdropModal>
