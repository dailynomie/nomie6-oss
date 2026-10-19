<svelte:options runes={true} />

<script lang="ts">
  import ListItem from '../../../components/list-item/list-item.svelte'

  import List from '../../../components/list/list.svelte'
  import IconSquare from '../../../components/icon-square/icon-square.svelte'

  import { AwardStore } from '../AwardsStore'

  let awardsToShow = $derived($AwardStore.awards
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
    .filter((a, index) => index < 4))
</script>


  <ListItem title="Awards" detail to="/awards" bottomLine={57}>
    <span slot="left"><IconSquare color="#C2185B">🥇</IconSquare></span>
    <div slot="right" class="flex items-center space-x-1">
      {#if awardsToShow.length}
        {#each awardsToShow as award, index}
          <img alt="award" src={`/images/awards/${award.id}.svg`} class="h-4 w-4" />
        {/each}
      {:else}
        None
      {/if}
    </div>
  </ListItem>
