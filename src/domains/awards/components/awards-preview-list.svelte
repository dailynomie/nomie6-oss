<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import { RibbonOutline } from '../../../components/icon/nicons'
  import ListItem from '../../../components/list-item/list-item.svelte'

  import List from '../../../components/list/list.svelte'
  import IconSquare from '../../../components/icon-square/icon-square.svelte'

  import { AwardStore } from '../AwardsStore'
  import { Lang } from '../../../store/lang'

  let awardsToShow = $derived(
    $AwardStore.awards.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)).filter((a, index) => index < 4)
  )
</script>

<ListItem title={Lang.t('awards.awards', 'Awards')} detail to="/awards" bottomLine={57}>
  <span slot="left"><IconSquare color="#E8746B"><IonIcon icon={RibbonOutline} size={17} /></IconSquare></span>
  <div slot="right" class="flex items-center space-x-1">
    {#if awardsToShow.length}
      {#each awardsToShow as award, index}
        <img alt={Lang.t('awards.award', 'Award')} src={`/images/awards/${award.id}.svg`} class="h-4 w-4" />
      {/each}
    {:else}
      {Lang.t('awards.none', 'None')}
    {/if}
  </div>
</ListItem>
