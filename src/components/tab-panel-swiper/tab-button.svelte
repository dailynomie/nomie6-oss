<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'


  const dispatch = createEventDispatcher()

  const { className, style, isActive, index } = $props()
</script>

<button
  class={`tab-button ${className}`}
  data-child-id={index}
  class:isActive
  {style}
  on:click={(evt) => dispatch('click', evt)}
>
  <slot />
</button>

<style lang="postcss" global>
  .tab-button {
    @apply py-1 px-2;
    @apply text-sm font-semibold;
    @apply text-ios-label dark:text-ios-label2;
  }
  .tab-button.isActive {
    @apply bg-ios-card text-ios-label rounded-full;
    @apply px-4;
    @apply scale-105;
  }
</style>
