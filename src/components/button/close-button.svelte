<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { Lang } from '../../store/lang'
  import Button from './button.svelte'
  const emit = createEventDispatcher()
  const { ...rest } = $props()
</script>

<!-- iOS look: Close in a header is tint text (clear), not a solid pill -->
<Button
  primary
  clear
  {...rest}
  on:click={(evt) => {
    emit('click', evt.detail)
  }}
>
  {Lang.t('general.close', 'Close')}
</Button>
