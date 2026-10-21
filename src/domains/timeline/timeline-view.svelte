<svelte:options runes={true} />

<script lang="ts">
  import type NLog from '../nomie-log/nomie-log'
  import dayjs, { type Dayjs } from 'dayjs'
  import { logsToTimeline, type TimelineFilterProps, type TimelineItemType } from './timeline-utils'

  import { TrackableStore } from '../trackable/TrackableStore'
  import TrackablePill from '../trackable/trackable-pill.svelte'

  import { getDateFormats } from '../preferences/Preferences'
  import { createEventDispatcher, untrack } from 'svelte'

  import { showTrackablePopmenu } from '../board/boardActions'

  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { ChevronForwardOutline } from '../../components/icon/nicons'
  import { Interact } from '../../store/interact'
  import Container from '../../components/container/container.svelte'
  import { openOnThisDayModal } from '../on-this-day/useOnThisDayModal'

  import math from '../../utils/math/math'

  import { Device } from '../../store/device-store'

  import NvirtualList from '../../components/nvirtual-list/nvirtual-list.svelte'
  import { UsageStore } from '../usage/UsageStore'
  import ListItemLog from '../../components/list-item-log/list-item-log.svelte'
  import { textToId } from '../../utils/text/text'

  import ListItem from '../../components/list-item/list-item.svelte'


  const { logs = [], filters = $bindable({}) } = $props<{ logs?: Array<NLog>, filters?: TimelineFilterProps }>()
  const dispatch = createEventDispatcher()

  let timeline: Array<TimelineItemType> = $state([])
  let dateFormats = $state(getDateFormats())

  let listStartIndex: number | undefined = $state(undefined)
  let listEndIndex: number | undefined = $state(undefined)

  $effect(() => {
    if ($TrackableStore?.trackables && logs && logs.length > 0) {
      const newTimeline = logsToTimeline(logs, $TrackableStore.trackables)
      // Use untrack to prevent the assignment from triggering dependent effects
      untrack(() => {
        timeline = newTimeline
      })
    }
  })

  let topItem: TimelineItemType | undefined = $state(undefined)

  const dayTitle = (day: Dayjs) => {
    const today = dayjs().startOf('day')
    const target = day.startOf('day')
    if (target.isSame(today, 'day')) return 'Today'
    if (target.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday'
    return target.format('dddd')
  }

  $effect(() => {
    if (listEndIndex === timeline.length && timeline.length > 0) {
      dispatch('endOfItems')
    }
  })
</script>

<NvirtualList
  on:topItem={(evt) => {
    untrack(() => {
      topItem = evt.detail
    })
    dispatch('scrollItem', evt.detail)
  }}
  items={timeline}
  let:item
  on:update={(evt) => {
    untrack(() => {
      listStartIndex = evt.detail.start
      listEndIndex = evt.detail.end
    })
  }}
>
  <Container size="md">
    <!-- iOS look: day title on the left (Today, Yesterday, or the weekday), date on the right -->
    <header class="flex items-end justify-between gap-3" style="padding: 22px 16px 7px">
      <button
        type="button"
        class="text-left hover:opacity-80 min-w-0"
        on:click={() => {
          openOnThisDayModal(item.logs[0].end)
        }}
      >
        <h2
          class="transform block transition-all duration-500 text-ios-title3 font-bold text-ios-label"
          class:text-sm={item.logs[0].endDayjs().format('YYYY-MM-DD') ==
            topItem?.logs[0].endDayjs().format('YYYY-MM-DD')}
        >
          {dayTitle(item.logs[0].endDayjs())}
          <IonIcon icon={ChevronForwardOutline} className="opacity-50" size={14} />
        </h2>
      </button>
      <div class="text-ios-footnote text-ios-label2 whitespace-nowrap">
        {item.logs[0].endDayjs().format(dateFormats.mmm_d_yyyy)}
      </div>
    </header>

    {#if filters.trackables}
      <div class="timeline-30">
        <div class="my-2 mx-4" class:hidden={!Object.keys(item.usage).length}>
          <div class="trackables relative z-0 rounded-group bg-ios-card">
            {#each Object.keys(item.usage)
              .map((tag) => {
                return { usage: item.usage[tag], tag: tag, item }
              })
              .sort((a, b) => {
                return a.usage.logs[a.usage.logs.length - 1].end < b.usage.logs[b.usage.logs.length - 1].end ? 1 : -1
              }) as usageMapItem, index (usageMapItem.tag)}
              <!-- <TimelineItem {item} /> -->
              <ListItem bottomLine={57} id="{textToId(usageMapItem.usage.trackable.tag)}-items">
                <TrackablePill
                  transparent
                  slot="left"
                  on:click={() => showTrackablePopmenu(usageMapItem.usage.trackable)}
                  value={usageMapItem.usage.trackable.formatValue(
                    usageMapItem.usage.trackable.tallyValues(usageMapItem.usage.values)
                  )}
                  hideValue={usageMapItem.usage.trackable.type === 'person' || usageMapItem.usage.trackable.type === 'pointer'}
                  trackable={usageMapItem.usage.trackable}
                  size={29}
                  className="stiff z-10 hover:scale-105 focus:scale-95 transition-all transform duration-200 mb-1 mr-1  lg:mr-2 shadow-md lg:col-span-3 md:col-span-6 col-span-6 timeline-pill w-full"
                />
                <div class="w-full">
                  <div class="flex w-full justify-end items-end flex-wrap">
                    {#each usageMapItem.usage.values
                      .map((v, i) => {
                        return { value: v, log: usageMapItem.usage.logs[i], date: usageMapItem.usage.dates[i], usage: usageMapItem.usage, trackable: usageMapItem.usage.trackable, percentage: math.percentage(UsageStore[usageMapItem.usage.trackable.tag]?.max.v || v, v) }
                      })
                      .sort((a, b) => (a.log.end > b.log.end ? 1 : -1)) as usageItem, index (index)}
                      <!-- iOS look: each value is a chip, the same as the chips on an entry: time, then the value in bold -->
                      <button
                        type="button"
                        class="tiny-trackable m-px"
                        aria-label="Log options for this value"
                        on:click={() => {
                          Interact.logOptions(usageItem.log, {
                            description: usageItem.log.note,
                          })
                        }}
                      >
                        <span class="label">{usageItem.date.format(dateFormats.time)}</span>
                        <span class="value">{usageItem.trackable.formatValue(usageItem.value)}</span>
                      </button>
                    {/each}
                  </div>
                </div>
              </ListItem>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if filters.notes}
      <div class="notes mx-4 rounded-group bg-ios-card">
        {#each item.logs.filter((nlog) => {
          if (filters.trackables) return nlog.hasNote
          return true
        }).sort((a,b)=>{
          if(a.pinned || b.pinned) {
            return a.pinned < b.pinned ? 1 : -1
          } else {
            return a.end < b.end ? 1 : -1
          }
        }) as log}
          <div class="log-row">
            <ListItemLog {log} hideTrackables={filters.trackables} />
          </div>
        {/each}
      </div>
    {/if}
    <!-- {#if filters.maps}
      <div class="px-4 pb-4">
        {#if item.logs.filter(l=>l.lat).length}
        <div class="map relative h-28 px-4 flex items-center justify-center bg-ios-fill text-ios-label2 text-opacity-50 rounded-lg">
          <Map lock records={item.logs} className="h-28 rounded-lg overflow-hidden shadow-md" />
        </div>
        {/if}
      </div>
    {/if} -->
  </Container>
</NvirtualList>

<style global lang="postcss">
  .map-floater {
    @apply absolute bottom-40 left-4;
    @apply h-20 w-20;
    @apply z-50;
  }
  .map-floater .leaflet-bottom,
  .map-floater .leaflet-top,
  .map-floater .leaflet-left {
    @apply hidden;
  }
  .bubble {
    background: var(--ios-card);
    border-radius: 12px;
    @apply p-2 pb-1;
    box-shadow: none;
  }

  .timeline-token {
    @apply text-ios-label rounded-lg p-0;
    @apply ring-primary-500 ring-offset-4;
    background: var(--ios-fill);
  }
  .timeline-token:active,
  .timeline-token:focus {
    @apply ring-2;
  }
  .bubble.note-bubble {
    @apply p-4;
    @apply font-medium;
  }

  /* iOS look: entries of one day share a grouped card, divided by 0.5 px lines */
  .log-row + .log-row {
    border-top: 0.5px solid var(--ios-separator);
  }
  .log-row .note-bubble {
    border-radius: 0;
  }

  .bubble .timeline-pill .title-value h3 {
    @apply font-medium text-ios-label;
  }

  /* iOS look: short and long notes use the same 15 px text (scales with Font Size), regular weight, as in the mockup */
  .bubble.note-bubble .text-size-sm,
  .bubble.note-bubble .text-size-big {
    font-size: 0.9375em;
    line-height: 1.33em;
    font-weight: 400;
  }
</style>
