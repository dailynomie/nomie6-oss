<svelte:options runes={true} />

<script lang="ts">
  // The test tube emoji, sized like the other board tab icons
  const { size = 22 } = $props()
</script>

<span class="experiment-board-icon" style="font-size: {size}px; line-height: {size}px;" aria-hidden="true">🧪</span>
