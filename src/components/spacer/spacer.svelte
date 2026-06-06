<svelte:options runes={true} />

<script lang="ts">
  export let className = "";

  export let gap = undefined;

  const { className, noFill, gap } = $props()
</script>

<div class="{!noFill ? 'flex-grow flex-shrink w-full' : 'w-0'} {className}">
  {#if gap}
    <div class="gap" style="height:{gap * 4}px; width:{gap * 4}px" />
  {/if}
</div>
