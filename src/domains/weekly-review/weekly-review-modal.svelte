<svelte:options runes={true} />

<script lang="ts">
  // I3: the weekly review. The numbers come from the code. The AI, if set up, only writes a short reading of them.
  // A review is kept as a note only when the user chooses it.
  import { onMount } from 'svelte'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { showToast } from '../../components/toast/ToastStore'
  import { Interact } from '../../store/interact'
  import { saveLog } from '../ledger/LedgerStore'
  import NLog from '../nomie-log/nomie-log'
  import { TrackableStore } from '../trackable/TrackableStore'
  import { Prefs } from '../preferences/Preferences'
  import { query } from '../ai/engine.svelte'
  import { Lang } from '../../store/lang'
  import { loadReview } from './weekly-review-query'
  import { reviewNote, reviewPrompt, REVIEW_DAYS, type Review, type TrackerWeek } from './weekly-review'

  const { id } = $props()

  let review = $state<Review | undefined>(undefined)
  let aiText = $state<string | undefined>(undefined)
  let aiBusy = $state(false)

  // the AI is used only when it is turned on and a key is set, the same test as the insight widget
  const aiReady = $derived(
    !!($Prefs.ai?.enabled && $Prefs.ai?.services?.[$Prefs.ai?.selectedService || 'claude']?.apiKey)
  )

  onMount(async () => {
    review = await loadReview($TrackableStore.trackables)
  })

  const daysLine = (r: Review, key: 'days' | 'note-days') =>
    Lang.t(`review.${key}`, { days: r.days, previous: r.previousDays })
  const trackerLine = (t: TrackerWeek, key: 'tracker' | 'note-tracker') =>
    Lang.t(`review.${key}`, { label: t.label, total: t.total, previous: t.previous })

  const askAi = async () => {
    if (!review || aiBusy) return
    aiBusy = true
    try {
      const language = Lang.t('review.ai-language', 'English')
      const response = await query<string>({ profile: 'review', prompt: reviewPrompt(review, language) })
      aiText = response.content
    } catch (e) {
      Interact.error(e.message)
    } finally {
      aiBusy = false
    }
  }

  const keep = async () => {
    if (!review) return
    const note = reviewNote(review, {
      title: Lang.t('review.note-title'),
      days: daysLine(review, 'note-days'),
      tracker: (t) => trackerLine(t, 'note-tracker'),
    })
    const withAi = aiText ? `${note}\n\n${aiText}` : note
    await saveLog(new NLog({ note: withAi, end: new Date() }))
    showToast({ message: Lang.t('review.kept', 'Saved as a note.') })
    closeModal(id)
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>{Lang.t('review.close', 'Close')}</Button>
      </div>
      <h2 class="ntitle">{Lang.t('review.title', 'Weekly review')}</h2>
      <div slot="right"></div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-4 text-ios-label">
    <p class="text-sm text-ios-label2">{Lang.t('review.intro', { days: REVIEW_DAYS })}</p>

    {#if review}
      <section class="p-4 ios-card space-y-2">
        <p>{daysLine(review, 'days')}</p>
        {#if review.trackers.length === 0}
          <p class="text-sm text-ios-label2">{Lang.t('review.none', 'No tracker values in the last 7 days yet.')}</p>
        {:else}
          {#each review.trackers as t}
            <p>{trackerLine(t, 'tracker')}</p>
          {/each}
        {/if}
      </section>

      <section class="p-4 ios-card space-y-3">
        <p class="text-sm font-semibold">{Lang.t('review.ai-title', 'Short reading by AI')}</p>
        {#if aiText}
          <p class="leading-relaxed">{aiText}</p>
        {:else if !aiReady}
          <p class="text-sm text-ios-label2">{Lang.t('review.ai-needs-setup', 'Turn on AI in Settings and add your key to use this.')}</p>
        {/if}
        <Button block clear primary disabled={!aiReady || aiBusy} on:click={askAi}>
          {aiBusy ? Lang.t('review.ai-working', 'Writing…') : Lang.t('review.ai-button', 'Ask AI for a short review')}
        </Button>
      </section>

      <Button block primary on:click={keep}>{Lang.t('review.keep', 'Keep as a note')}</Button>
    {/if}
  </main>
</BackdropModal>
