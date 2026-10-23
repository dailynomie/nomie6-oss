<svelte:options runes={true} />

<script lang="ts">
  import Input from '../../../../components/input/input.svelte'

  import List from '../../../../components/list/list.svelte'
  import { parseNumber } from '../../../../utils/parseNumber/parseNumber'
  import type { Trackable } from '../../Trackable.class'
  import { Lang } from '../../../../store/lang'

  let { trackable = $bindable() } = $props<{ trackable: Trackable }>()
</script>

<List solo>
  <Input
    listItem
    type="select"
    label={Lang.t('trackable.duration', 'Duration')}
    placeholder={Lang.t('trackable.duration-in-days', 'Duration (in Days)')}
    value={`${trackable.ctx.duration || 1}`}
    options={Array.from({ length: 30 }, (_, index) => ({ value: `${index + 1}`, label: Lang.t('trackable.n-days', { count: index + 1 }) }))}
    on:change={(evt) => {
      trackable.ctx.duration = parseNumber(evt.detail)
    }}
  />
</List>
<p class="list-note">
  {Lang.t(
    'trackable.duration-days-is-how-long-this-context-tends-to-',
    'Duration Days is how long this context tends to impact your life. Context is used to mark specific points in your life with things that can impact you for multiple days. For example being sick, or rushing for a project.'
  )}
</p>
