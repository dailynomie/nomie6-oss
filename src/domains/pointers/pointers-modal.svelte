<svelte:options runes={true} />

<script lang="ts">
  import { onMount, untrack } from 'svelte'
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
  import { closePointersModal } from './pointer-store'
  //import { getPointers  } from './PointerStore'
  import { AllTrackablesAsArray } from '../trackable/TrackableStore'
  import { openTrackableEditor } from '../trackable/trackable-editor/TrackableEditorStore'
  import { Trackable } from '../trackable/Trackable.class'

  let pointers = $state<string | any[]>([])

  const updatePointers = () => {
    const trackables = $AllTrackablesAsArray
    if (trackables && trackables.length > 0) {
      pointers = trackables
        .filter((trackable) => trackable.type == 'pointer')
        .sort((a, b) => {
          // Sort on reminder enabled
          if (a.ptr.reminder < b.ptr.reminder) return 1
          if (a.ptr.reminder > b.ptr.reminder) return -1
          // Only sort on date if not identical
          if (new Date(a.ptr.reminderdate) < new Date(b.ptr.reminderdate)) return -1
          if (new Date(a.ptr.reminderdate) > new Date(b.ptr.reminderdate)) return 1
          // Both identical, return 0
          return 0
        })
    }
  }

  $effect(() => {
    if ($AllTrackablesAsArray) {
      untrack(() => {
        updatePointers()
      })
    }
  })

  onMount(() => {
    updatePointers()
  })

  //let editMode: boolean = false
  let hasLocked: boolean = false


</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <Button on:click={closePointersModal} slot="left" clear primary>{Lang.t('general.close', 'Close')}</Button>
      <h1 class="ntitle text-sm md:text-base">{Lang.t('general.pointers', 'Pointers')}</h1>
      <div slot="right">
        {#if !hasLocked}
          <Button on:click={() => openTrackableEditor(
            new Trackable({
              type: 'pointer',
            })
          )} icon clear primary>
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
            <p class="text-xs text-center text-ios-label2 leading-snug">
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
              openTrackableEditor(
                new Trackable({
                type: 'pointer',
               })
              )
            }}
            titleClass="text-center text-primary"
            title="Add a Pointer"
          />
        </List>
        <div class="flex items-center gap-2 px-4 py-0.5 text-ios-footnote text-ios-label2">
          <span class="w-2.5 h-2.5 rounded-full bg-ios-danger"></span>
          <span>Pointer Reminder Overdue</span>
        </div>
        <div class="flex items-center gap-2 px-4 py-0.5 text-ios-footnote text-ios-label2">
          <span class="w-2.5 h-2.5 rounded-full bg-ios-good"></span>
          <span>Pointer Reminder Planned</span>
        </div>
        <div class="flex items-center gap-2 px-4 py-0.5 text-ios-footnote text-ios-label2">
          <span class="w-2.5 h-2.5 rounded-full bg-ios-tint"></span>
          <span>Pointer Reminder Disabled</span>
        </div>
  </section>
</BackdropModal>
