<svelte:options runes={true} />

<script lang="ts">
  // iOS look (guide 4.1 and 5.11): a 29 px square in the icon palette, with a white glyph or emoji
  const { color = '#0A6CC9', size = 29 } = $props<{ color?: string; size?: number }>()
</script>

<span
  class="icon-square"
  style="background:{color}; width:{size}px; height:{size}px; font-size:{Math.round(size * 0.56)}px"
>
  <slot />
</span>

<style>
  .icon-square {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 7px;
    color: #ffffff;
    line-height: 1;
  }
</style>
