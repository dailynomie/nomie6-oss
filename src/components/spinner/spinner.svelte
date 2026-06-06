<svelte:options runes={true} />

<script lang="ts">
  import Circle3 from './circle3.svelte'
  export let size = 60
  export const style = ''

  const { size } = $props()
</script>

<Circle3 {size} {style} />
