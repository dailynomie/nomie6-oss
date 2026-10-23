<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): the settings selects are the app's IosSelect (the value row and the action sheet with a tick).
  // Callers pass options as { key, value, selected } and listen for change with the picked option.
  import { createEventDispatcher } from 'svelte'
  import IosSelect from '../components/ios-select/ios-select.svelte'

  const emit = createEventDispatcher()
  const { className, value, placeholder, id, options = [], ...rest } = $props()

  let current = $derived(options.find((o: any) => o.selected))
</script>

<IosSelect
  className="select-pop {rest.class || ''} {className || ''}"
  title={placeholder || value || ''}
  placeholder={placeholder || value || ''}
  value={current?.key}
  options={options.map((o: any) => ({ value: o.key, label: o.value }))}
  onchange={(key) => {
    const picked = options.find((o: any) => o.key == key)
    if (picked) emit('change', picked)
  }}
/>
