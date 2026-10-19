<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { Trackable } from '../../domains/trackable/Trackable.class'
  import TrackableAvatar from '../avatar/trackable-avatar.svelte'

  const emit = createEventDispatcher()

  const { date, trackable, value } = $props()

  let color = $derived(trackable?.color)
</script>

{#if trackable.type == "pointer"}
<button class="tiny-trackable" style="background-color: {color};border-radius: 90px" on:click={() => emit('click')}>
  <TrackableAvatar className="items-center self-center" {trackable} size={18} />
  
</button>
{:else}
<button class="tiny-trackable" on:click={() => emit('click')}>
  <span class="chip-dot" style="background-color: {color}" />
  <span class="label line-clamp-1">{trackable.label}</span>
  {#if value}
    <span class="value">{trackable.formatValue(value)}</span>
  {/if}
</button>
{/if}
<style lang="postcss" global>
  /* iOS look: timeline chips are 24 px high, 13 px text, with an 8 px colour dot, the label, then the value in bold */
  .tiny-trackable {
    @apply flex items-center;
    @apply whitespace-nowrap;
    @apply space-x-1;
    @apply text-ios-footnote;
    @apply flex-shrink;
    @apply w-auto;
    @apply mr-1 mt-1;
    background: var(--ios-fill);
    border-radius: 12px;
    height: 24px;
    padding: 0 9px;

    @apply transform-gpu transition-all duration-100 ease-in-out;
    @apply max-w-full;
  }
  .tiny-trackable .chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .tiny-trackable:hover {
    @apply scale-105;
  }
  .tiny-trackable:active {
    @apply scale-90;
  }

  .tiny-trackable .label {
    @apply font-normal;
    color: var(--ios-label);
  }
  .tiny-trackable .value {
    @apply font-bold;
    color: var(--ios-label2);
  }
</style>
