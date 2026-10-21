<svelte:options runes={true} />

<script lang="ts">


  const { className, style, solid, tint, pad } = $props()
</script>

<style lang="postcss" global>
  .form-group {
    @apply rounded-xl;
    @apply overflow-hidden;
    @apply mb-3;
  }
  .form-group.no-bottom {
    @apply mb-0;
  }
  .form-group.pad {
    @apply mx-3;
  }
  .form-group.solid {
    @apply bg-ios-card dark:bg-opacity-50;
  }
  .form-group.tint {
    @apply bg-ios-card;
  }
</style>

<div class:pad class:tint class:solid class="form-group {className}" {style}>
  <slot />
</div>
