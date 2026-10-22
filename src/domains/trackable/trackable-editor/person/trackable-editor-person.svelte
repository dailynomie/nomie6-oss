<svelte:options runes={true} />

<script lang="ts">
  import Input from '../../../../components/input/input.svelte'
  import List from '../../../../components/list/list.svelte'
  import type { Trackable } from '../../Trackable.class'
  import { Lang } from '../../../../store/lang'

  let { trackable = $bindable() } = $props<{ trackable: Trackable }>()
</script>

<List solo>
  <Input
    listItem
    type="textarea"
    label={Lang.t('trackable.note-about-person', 'Note about Person')}
    placeholder={Lang.t('trackable.about-this-person', 'About this Person')}
    bind:value={trackable.person.notes}
  />
</List>
