<svelte:options runes={true} />

<script lang="ts">


  const { title, className, style, isActive } = $props()
</script>

<div class="tab-panel filler {className}" data-title={title} {style}>
  {#if !isActive}
    <slot name="inactive" />
  {:else}
    <slot name="active" />
  {/if}
  <slot />
</div>

<style lang="postcss" global>
  .tab-panel {
    @apply text-ios-label;
    @apply h-full flex-grow flex-shrink;
  }
</style>
