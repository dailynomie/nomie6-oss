<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'

  import type NLog from '../../domains/nomie-log/nomie-log'
  import { TrackerStore } from '../../domains/tracker/TrackerStore'
  import { positivityFromLogs } from '../../utils/positivity/positivity'

  let mounted = $state(false)
  let byHour = $state<Array<any>>([])
  let score = $state(0)

  const { logs, className } = $props()

  $effect(() => {
    if (logs && mounted) {
      let pos = positivityFromLogs(logs, $TrackerStore)
      let totalScore = 0
      byHour = pos.byHour.map((number) => {
        totalScore = totalScore + number
        if (number > 0) {
          return 'positive'
        } else if (number < 0) {
          return 'negative'
        } else {
          return 'neutral'
        }
      })
      score = totalScore
    }
  })

  onMount(() => {
    mounted = true
  })
</script>

{#if score}
  <div class="score-grid {className || 'h-4'}">
    <div class="score flex items-center bg-ios-card px-1 text-xs">
      {score}
    </div>
    {#each byHour as hour, index}
      <div class="hour {hour}" />
    {/each}
  </div>
{/if}

<style lang="postcss" global>
  .score-grid {
    @apply bg-ios-fill;
    @apply flex leading-none rounded-md overflow-hidden space-x-px w-full;
  }
  .score-grid .score {
    @apply font-semibold;
    font-size: 0.7rem;
  }
  .score-grid .hour {
    @apply transition-all duration-100;
    width: calc(100% / 24 + 1px);

    @apply bg-ios-fill;
  }
  .score-grid .hour.positive {
    @apply from-ios-good via-ios-good to-ios-good bg-gradient-to-t;
  }
  .score-grid .hour.negative {
    @apply from-ios-danger via-ios-danger to-ios-danger bg-gradient-to-t;
  }
</style>
