<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  // components
  import NHScroller from '../h-scroller/h-scroller.svelte'
  import FeatureBadge from '../advanced-badge/feature-badge.svelte'

  import './board-tabs.css'
  import IonIcon from '../icon/ion-icon.svelte'
  import type { UniboardType } from '../../domains/board/UniboardStore'
  import SortableList2 from '../sortable-list/sortable-list2.svelte'
  import { EXPERIMENT_BOARD_ID } from '../../config/board-ids'
  import CloseOutline from '../../n-icons/CloseOutline.svelte'

  import { Interact } from '../../store/interact'
  import { showToast } from '../toast/ToastStore'
  import { Prefs } from '../../domains/preferences/Preferences'
  import { Lang } from '../../store/lang'

  const dispatch = createEventDispatcher()

  let state = $state({
    active: null,
    activeIndex: 0,
    hasTimers: false,
    editMode: false,
  })
  let ready = $state(true)
  let localBoards = $state<Array<UniboardType>>([])
  let active = $state<UniboardType>(undefined)

  // The screen supplies the boards, the active board and the two actions (CMP-08)
  const {
    boards,
    className,
    editMode,
    combinedBoards = [],
    activeBoard = undefined,
    onSortBoards = (_userBoards: Array<UniboardType>) => {},
    onDeleteBoard = async (_board: UniboardType) => {},
  } = $props()

  $effect(() => {
    if (combinedBoards && $Prefs) {
      localBoards = combinedBoards || []
      active = activeBoard
    }
  })

  $effect(() => {
    if (editMode === true) {
      state.editMode = true
    } else if (editMode === false) {
      state.editMode = false
    }
  })

  $effect(() => {
    if (boards && boards.length && active) {
      boards.forEach((b, index) => {
        if (b.id == active.id && b.id !== '_all' && b.id !== '_timers') {
          state.activeIndex = index
        }
      })
    }
  })

  // iOS look (Phase 5 decision, Ronald): Main, All, People, Context and Experiments keep their place.
  // Only the user's own boards have the drag handle class, and a drop keeps the fixed tabs in front.
  const isFixedBoard = (id: string) => id === 'main' || id.startsWith('_') || id === EXPERIMENT_BOARD_ID

  function onSorted(sorted: Array<UniboardType>) {
    const fixed = (combinedBoards || []).filter((b) => isFixedBoard(b.id))
    const userBoards = sorted.filter((b) => !isFixedBoard(b.id))
    localBoards = [...fixed, ...userBoards]
    onSortBoards(userBoards)
  }

  // iOS look (Ronald decision): deleting All, People, Context or Experiments turns that board off in Settings,
  // as its toggle does. Main has no delete badge.
  function disableFixedBoard(id: string) {
    if (id === '_all') $Prefs.allBoard = false
    else if (id === '_people') $Prefs.peopleBoard = false
    else if (id === '_context') $Prefs.contextBoard = false
    else if (id === EXPERIMENT_BOARD_ID) $Prefs.experimentBoard = false
  }

  async function deleteBoard(board) {
    let confirmed = await Interact.confirm(
      'Delete ' + board.label + ' tab?',
      "You can recreate it later, but it's not super easy."
    )
    if (confirmed === true) {
      ready = false
      await onDeleteBoard(board)
      ready = true
      showToast({ message: Lang.t('ui.deleted', 'Deleted') })
    }
  }
</script>

{#if combinedBoards && combinedBoards.length === 1}
  <div
    class="flex items-center flex-grow flex-shrink n-board-tabs min-h-14 max-h-14 h-14 {className}"
    data-scroll="0"
  />
{:else if combinedBoards && combinedBoards.length > 1}
  <div class="n-board-tabs {className} {state.editMode ? 'is-editing' : ''}">
    {#if !state.editMode}
      <NHScroller activeIndex={state.activeIndex} wrapperClass="space-x-2" className="n-board-tabs overflow-y-hidden">
        {#each localBoards as board}
          <button
            title={`${board.label} board tab`}
            type="menu"
            class="tab board-{board.id}  {board.id === active?.id ? 'selected' : 'inactive'}"
            on:click={() => {
              dispatch('tabTap', board)
            }}
          >
            {#if board.icon}
              <IonIcon icon={board.icon} size={22} />
            {:else}{board.label}{/if}
          </button>
        {/each}
        <slot />
        <slot name="right" />
      </NHScroller>
    {:else if ready}
      <SortableList2
        containerClass="w-full items-center flex-nowrap flex overflow-x-auto overflow-y-visible mx-auto max-w-screen-xl border-2 border-ios-separator rounded-full h-14"
        className="items-center h-14"
        bind:items={localBoards}
        handleClass="board-tab"
        key="id"
        direction="x"
        on:update={(evt) => {
          onSorted(evt.detail)
        }}
        let:item
      >
        <div class="px-1 relative">
          {#if item.id !== 'main'}
            <button
              on:click|preventDefault={() => {
                if (isFixedBoard(item.id)) {
                  disableFixedBoard(item.id)
                } else {
                  deleteBoard(item)
                }
              }}
              class="delete-button tab-delete"
              aria-label={isFixedBoard(item.id) ? `Turn off ${item.label} tab` : `Delete ${item.label} tab`}
            >
              <IonIcon className="text-ios-ondanger" icon={CloseOutline} size={10} />
            </button>
          {/if}
          <button
            class="tab relative animate-shake-big {isFixedBoard(item.id)
              ? 'board-fixed'
              : 'board-tab'} mt-1 board-{item.id} {item == active ? 'selected ' : 'inactive'}"
          >
            {#if item.icon}
              <IonIcon icon={item.icon} size={22} />
            {:else}{item.label}{/if}
            <FeatureBadge
              feature={item.id === '_people' ? 'people-board' : item.id === '_context' ? 'context-board' : undefined}
            />
          </button>
        </div>
      </SortableList2>
    {/if}
  </div>
{/if}

<style lang="postcss" global>
  .add-board:before {
    display: none;
  }
  button.inactive {
    opacity: 0.8;
  }
</style>
