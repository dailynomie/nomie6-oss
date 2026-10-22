<svelte:options runes={true} />

<script lang="ts">
  import FlaskOutline from '../FlaskOutline.svelte'

  // The flask, the same icon as the Experiments tab and the settings row
  const { size = 22 } = $props()
</script>

<span class="experiment-board-icon" aria-hidden="true"><FlaskOutline {size} /></span>
