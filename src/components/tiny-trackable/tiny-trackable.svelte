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
<!-- iOS look: a pointer has no label, so it is a 24 px circle with the same emoji size as the other chips -->
<button class="tiny-trackable pointer-chip" style="background-color: {color}" on:click={() => emit('click')}>
  <TrackableAvatar className="items-center self-center" {trackable} size={16} />
  
</button>
{:else}
<button class="tiny-trackable" on:click={() => emit('click')}>
  <TrackableAvatar className="items-center self-center" {trackable} size={16} />
  <span class="label line-clamp-1">{trackable.label}</span>
  {#if value}
    <span class="value">{trackable.formatValue(value)}</span>
  {/if}
</button>
{/if}
<style lang="postcss" global>
  /* iOS look: timeline chips are 24 px high, 13 px text, with a small emoji, the label, then the value in bold */
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
  .tiny-trackable.pointer-chip {
    width: 24px;
    padding: 0;
    justify-content: center;
    border-radius: 12px;
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
