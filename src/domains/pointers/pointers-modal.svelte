<script lang="ts">
  import { onMount } from 'svelte'
  import PointerBoard from './pointer-board.svelte'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import Button from '../../components/button/button.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import PlusIcon from '../../n-icons/PlusIcon.svelte'
  import { Lang } from '../../store/lang'
  //import PluginInstaller from './plugin-installer.svelte'
  import { closePointersModal } from './PointerStore'
  //import { getPointers  } from './PointerStore'
  import { AllTrackablesAsArray } from '../trackable/TrackableStore'

  onMount(async () => {
    const trackables = $AllTrackablesAsArray
    pointers =  trackables.filter((trackable) => {
    return trackable.type == 'context' && trackable.ctx?.duration !== 0;
    
});
   console.log(pointers)
  })

  let pointers: string | any[] = []

  //let editMode: boolean = false
  let hasLocked: boolean = false

  const installPlugin = (url?: string) => {
    //temp
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <Button on:click={closePointersModal} slot="left" clear primary>{Lang.t('general.close', 'Close')}</Button>
      <h1 class="ntitle text-sm md:text-base">{Lang.t('general.pointers', 'Pointers')}</h1>
      <div slot="right">
        {#if !hasLocked}
          <Button on:click={() => installPlugin()} icon clear primary>
            <IonIcon icon={PlusIcon} />
          </Button>
        {/if}
      </div>
    </ToolbarGrid>
  </header>
  <section class="px-2 lg:px-4 py-4">
    
    

      
        <div class="h-4 stiff w-full min-h-4" />
        <List solo>
          {#if pointers.length === 0}
          <Empty emoji="🏷" title="No Pointers Configured">
            <p class="text-xs text-center text-gray-500 leading-snug">
              Pointers allow you to tag single Nomie notes. This enables you to zoom in to these Notes later. <small
                >EXAMPLE: Create a pointer named 'healthcheck'. Add this pointer to the note with your yearly healthcheck measurements..</small>
            </p>
          </Empty>
          {:else}
          <Empty emoji="🏷" title="Configured Pointers">
            <p>.</p>
            <PointerBoard bind:pointers></PointerBoard>
          </Empty>
          {/if}
          <ListItem
            clickable
            on:click={() => {
              console.log("action")
            }}
            titleClass="text-center text-primary"
            title="Add a Pointer"
          />
        </List>
     

  </section>
</BackdropModal>
