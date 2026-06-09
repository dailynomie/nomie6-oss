<svelte:options runes={true} />

<script lang="ts">
  // import type { WidgetClass } from '../widget-class'
  import { getFocusScoresFromLogs, type IFocusResults } from '../../../focus/focus-utils'
  import { TrackableStore } from '../../../trackable/TrackableStore'
  import FocusGraph from '../../../../components/charts/focus-graph.svelte'
  import type NLog from '../../../nomie-log/nomie-log'

  // export let widget: WidgetClass
  const { logs = $bindable(), widget = $bindable(undefined), trackable = $bindable(undefined), usage = $bindable(undefined) } = $props()
  let scores = $state<Array<IFocusResults>>([])

  $effect(() => {
    if (logs && logs.length > 0) {
      scores = getFocusScoresFromLogs(logs, $TrackableStore.trackables)
    }
  })
</script>

<div class="mind-body-spirit flex item-center justify-center h-full">
  {#if scores.length > 0}
    <FocusGraph {scores} />
  {:else}
    Loading...
  {/if}
</div>

<style lang="postcss">
</style>
