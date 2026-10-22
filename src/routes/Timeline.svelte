<svelte:options runes={true} />

<script lang="ts">
  /**
   * Timeline Page
   * Mon Feb 21 2022 - Brandon
   * The timeine page will show an infinite scrolling list of your activities
   */

  import dayjs from 'dayjs'
  import type { Dayjs } from 'dayjs'
  import { untrack } from 'svelte'

  import Layout from '../domains/layout/layout.svelte'

  import { getDateFormats } from '../domains/preferences/Preferences'
  import LetterTicker from '../components/letter-ticker/letter-ticker.svelte'
  import { TrackableStore } from '../domains/trackable/TrackableStore'

  import Button from '../components/button/button.svelte'
  import IonIcon from '../components/icon/ion-icon.svelte'
  import { CalendarOutline, ChevronForwardOutline, FunnelOutline, SearchIcon } from '../components/icon/nicons'

  import { selectFuzzyDate } from '../domains/timeline/select-date-fuzzy'
  import { openOnThisDayModal } from '../domains/on-this-day/useOnThisDayModal'

  import Toolbar from '../components/toolbar/toolbar.svelte'
  import type { TimelineFilterProps, TimelineItemType } from '../domains/timeline/timeline-utils'
  import { openUnisearch } from '../domains/search/UnisearchStore'

  import { TimelineOptionsStore } from '../domains/timeline/timeline-helpers'
  import ContextChart from '../domains/context/context-chart.svelte'

  import Container from '../components/container/container.svelte'

  import MenuInline from '../components/menu/menu-inline.svelte'

  import type { PopMenuButton } from '../components/pop-menu/usePopmenu'

  import CreateOutline from '../n-icons/CreateOutline.svelte'
  import AppsOutline from '../n-icons/AppsOutline.svelte'
  import BarChartOutline from '../n-icons/BarChartOutline.svelte'

  import CaretDownCircle from '../n-icons/CaretDownCircle.svelte'
  import PositivityGrid from '../components/positivity-bar/positivity-grid.svelte'

  import TimelineLoader from '../domains/timeline/timeline-loader.svelte'
  import { Lang } from '../store/lang'

  let startingDate = $state<Date>(new Date())
  let date = $derived(dayjs(startingDate))
  let topItem = $state<TimelineItemType>(undefined)
  let displayDate = $state(dayjs())
  let inPast = $state(false)

  const dateFormats = getDateFormats()

  let hashDate: any

  $effect(() => {
    if (date && date !== hashDate && $TrackableStore.ready) {
      hashDate = date
    }
  })

  /**
   * Jump to specific point in time
   */
  const jumpTo = async () => {
    const jumpDate = await selectFuzzyDate(dayjs(date), false)
    if (jumpDate) {
      startingDate = jumpDate.toDate()
      inPast = jumpDate.toDate().toDateString() !== new Date().toDateString()
    }
  }

  /**
   * View Base Filters
   * This allows you to show and hide different elements in the timeline
   */
  const baseFilters: TimelineFilterProps = {
    notes: true,
    maps: false,
    trackables: false,
    context: false,
    pointers: false,
  }

  // A function that takes a filter object and returns a new filter object with the search and startingDate properties set to undefined.
  export function clearFilterSearch(filter: TimelineFilterProps): TimelineFilterProps {
    const f = { ...filter }
    f.search = undefined
    return f
  }

  let filters: TimelineFilterProps = $state({ ...baseFilters })

  /**
   * Show the Menu Filter
   * Popdown
   */
  const showFilterMenu = () => {
    let options = [
      {
        title: Lang.t('routes.notes', 'Notes'),
        checked: filters.notes,
        icon: CreateOutline,
        click() {
          filters.notes = !filters.notes
          TimelineOptionsStore.setItem('filters', clearFilterSearch(filters))
        },
      },
      {
        title: Lang.t('routes.trackables', 'Trackables'),
        checked: filters.trackables,
        icon: AppsOutline,
        click() {
          filters.trackables = !filters.trackables
          TimelineOptionsStore.setItem('filters', clearFilterSearch(filters))
        },
      },
      {
        title: Lang.t('routes.context-chart', 'Context Chart'),
        icon: BarChartOutline,
        checked: filters.context,
        click() {
          filters.context = !filters.context
          TimelineOptionsStore.setItem('filters', clearFilterSearch(filters))
        },
      },
    ]

    return options
  }

  let filterMenu = $derived(showFilterMenu())
  let mounted = $state(true)

  $effect(() => {
    if ($TimelineOptionsStore.filters) {
      const newFilters = $TimelineOptionsStore.filters
      if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
        filters = newFilters
      }
    }
  })
</script>

<Layout pageTitle="Timeline" className="timeline-layout">
  <header slot="header" class="glass z-50 px-4 pt-1 pb-1">
    <div class="flex items-center justify-end gap-2 h-9">
      <button
        type="button"
        aria-label={Lang.t('routes.jump-to-date', 'Jump to date')}
        class="ios-round {inPast ? 'ios-round-alert' : ''}"
        on:click={() => jumpTo()}
      >
        <IonIcon icon={CalendarOutline} size={18} />
      </button>
      <MenuInline
        id="timeline-filter"
        title={Lang.t('routes.filter-timeline', 'Filter timeline')}
        x="right"
        y="bottom"
        menuButtons={filterMenu}
        buttonClass="ios-round"
      >
        <IonIcon icon={FunnelOutline} size={18} />
      </MenuInline>
    </div>
    <h1 class="text-ios-large font-bold text-ios-label">{Lang.t('routes.timeline', 'Timeline')}</h1>
    <div class="max-w-xl w-full mt-1 collapsible-row">
      <PositivityGrid className="h-2" logs={topItem?.logs || []} />
    </div>
    <button
      type="button"
      class="ios-search mt-2"
      aria-label={Lang.t('routes.search-notes', 'Search notes')}
      on:click={() => openUnisearch()}
    >
      <IonIcon icon={SearchIcon} size={16} />
      <span>{Lang.t('routes.search-notes-trackers-people', 'Search notes, #trackers, @people')}</span>
    </button>
  </header>

  {#if filters.context}
    <Container className="px-4 py-2">
      <ContextChart height={150} bind:date={displayDate} on:item-click={(evt) => {}} />
    </Container>
  {/if}

  <TimelineLoader
    on:xfilters={(evt) => {
      filters = { ...filters, ...evt.detail }
      TimelineOptionsStore.setItem('filters', filters)
    }}
    bind:startingDate
    on:topItem={(evt) => {
      topItem = evt.detail
      if (topItem?.logs?.[0]) {
        displayDate = dayjs(topItem.logs[0].end)
      }
    }}
    {filters}
  />
  <div class="h-14" />
</Layout>

<style lang="postcss" global>
  /* iOS look: the inline search field on the Timeline header (the round buttons are in main.css) */
  .ios-search {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border-radius: 10px;
    border: 0;
    background: var(--ios-fill);
    /* light mode: a darker grey, so the placeholder reaches 4.5:1 on the fill (label-2 is 4.2:1 there) */
    color: #5c5c60;
    font-size: 17px;
  }
  html.dark .ios-search {
    color: var(--ios-label2);
  }
</style>
