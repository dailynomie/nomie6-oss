<svelte:options runes={true} />

<script lang="ts">
  import ListItem from '../../../components/list-item/list-item.svelte'
  import List from '../../../components/list/list.svelte'
  import { Lang } from '../../../store/lang'

  import type { Trackable } from '../Trackable.class'

  const { trackable } = $props<{ trackable: Trackable }>()

  const remove = () => {}
</script>

<List className="pb-10">
  <ListItem
    on:click={() => {
      alert('Todo:// make download trackable')
    }}
    className="bottom-line"
  >
    <div class="text-ios-tint">
      {Lang.t('general.download', 'Download')} .tkr
    </div>
    <div slot="right" class="text-ios-label2 text-sm">For Sharing</div>
  </ListItem>
  <!-- <ListItem on:click={duplicate} className="bottom-line">
    <div class="text-ios-tint">
      {Lang.t('tracker.duplicate-tracker', 'Duplicate Tracker')}
    </div>
  </ListItem> -->

  <ListItem on:click={remove} className="bottom-line">
    <div class="text-ios-danger">
      {Lang.t('tracker.remove-tracker', 'Delete Tracker')}
    </div>
  </ListItem>
</List>
