<svelte:options runes={true} />

<script lang="ts">
  import type { TrackableUsage } from '../../../usage/trackable-usage.class'
  // import type { Trackable } from '../../../trackable/Trackable.class'
  import type { WidgetClass } from '../widget-class'
  import UsageChart from '../../../usage/usage-chart.svelte'

  import nid from '../../../../modules/nid/nid'
  import { Prefs } from '../../../preferences/Preferences'
  import { queryToTrackableUsage } from '../../../ledger/LedgerStore'
  import { tokenToTrackable } from '../../../../modules/tokenizer/tokenToTrackable'
  import { TrackableStore } from '../../../trackable/TrackableStore'

  const { trackable = $bindable(undefined), widget = $bindable(), usage = $bindable() } = $props()
  // export let trackable: Trackable | undefined = undefined

  let type = $state<'bar' | 'line'>('bar')

  let reverseUsage = $state<TrackableUsage | undefined>(undefined)
  let secondUsage = $state<TrackableUsage | undefined>(undefined)
  let usages = $state<Array<TrackableUsage>>([])

  $effect(() => {
    // Explicitly reference usage to ensure dependency tracking
    if (usage && widget) {
      if (['last-365', 'this-year'].indexOf(widget.timeframe.details.id) > -1) {
        reverseUsage = usage
          .reverse()
          .groupBy('week', 'YYYY-MM-D')
          .backfill(widget.getStartDate($Prefs.weekStarts).toDate(), widget.getEndDate($Prefs.weekStarts).toDate())
      } else {
        reverseUsage = usage
          .reverse()
          .byDay.backfill(widget.getStartDate($Prefs.weekStarts).toDate(), widget.getEndDate($Prefs.weekStarts).toDate())
      }
    }
  })

  // Load second tracker data if available
  $effect(async () => {
    if (widget && widget.secondToken) {
      try {
        const secondTrackable = tokenToTrackable(widget.secondToken, $TrackableStore.trackables)
        const secondUsageData = await queryToTrackableUsage(
          secondTrackable,
          {
            start: widget.getStartDate($Prefs.weekStarts),
            end: widget.getEndDate($Prefs.weekStarts),
          },
          $TrackableStore.trackables
        )

        if (secondUsageData) {
          let rawUsage = secondUsageData
          if (['last-365', 'this-year'].indexOf(widget.timeframe.details.id) > -1) {
            secondUsage = rawUsage
              .reverse()
              .groupBy('week', 'YYYY-MM-D')
              .backfill(widget.getStartDate($Prefs.weekStarts).toDate(), widget.getEndDate($Prefs.weekStarts).toDate())
          } else {
            secondUsage = rawUsage
              .reverse()
              .byDay.backfill(widget.getStartDate($Prefs.weekStarts).toDate(), widget.getEndDate($Prefs.weekStarts).toDate())
          }
        }
      } catch (e) {
        console.error('Error loading second tracker:', e)
        secondUsage = undefined
      }
    } else {
      secondUsage = undefined
    }
  })

  // Build usages array based on available data
  $effect(() => {
    const arr: Array<TrackableUsage> = []
    if (reverseUsage) arr.push(reverseUsage)
    if (secondUsage) arr.push(secondUsage)
    usages = arr
  })

  $effect(() => {
    // Explicitly reference usage and widget to ensure dependency tracking
    if (usage && widget) {
      if (widget.type == 'barchart') {
        type = 'bar'
      } else {
        type = 'line'
      }
    }
  })
</script>

{#if widget && reverseUsage}
  <div class="chart-value relative h-full">
    <UsageChart
      id={`usage-${nid(widget.id)}`}
      hideValues={widget.size == 'sm'}
      {usages}
      dualAxis={usages.length > 1}
      {type}
      className="w-full"
    />
  </div>
{/if}

<style lang="postcss">
  .chart-value {
    height: 100%;
    flex-grow: 1;
    flex-shrink: 0;
    display: flex;
    width: 100%;
    display: column;
    justify-content: stretch;
  }
</style>
