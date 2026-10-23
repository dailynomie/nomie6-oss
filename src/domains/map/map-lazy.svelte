<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import Spinner from '../../components/spinner/spinner.svelte'

  // The map library is large, so the map loads the first time a map is shown.
  // The wrapper passes on the props, the bindings and the change event of the map.
  let {
    locations = $bindable(),
    records = $bindable(),
    lock = $bindable(),
    height,
    className = '',
    style = '',
    ...rest
  } = $props()

  const dispatch = createEventDispatcher()
  const mapModule = import('./map.svelte')
</script>

{#await mapModule}
  <div
    class="flex items-center justify-center {className}"
    style="{height ? `height: ${height}px;` : 'min-height: 100px;'} {style}"
  >
    <Spinner size={22} />
  </div>
{:then mod}
  {@const Map = mod.default}
  <Map
    bind:locations
    bind:records
    bind:lock
    {height}
    {className}
    {style}
    {...rest}
    on:change={(evt) => dispatch('change', evt.detail)}
  />
{/await}
