<svelte:options runes={true} />

<script lang="ts">
  import TodayDateController from '../domains/usage/today-date-controller.svelte'
  import { ActiveBoard, deleteUniboard, saveSortedBoards } from '../domains/board/UniboardStore'
  import Toolbar from '../components/toolbar/toolbar.svelte'
  import Button from '../components/button/button.svelte'
  import MenuInline from '../components/menu/menu-inline.svelte'
  import IonIcon from '../components/icon/ion-icon.svelte'
  import BoardTabs from '../components/board-tabs/board-tabs.svelte'
  import SearchBar from '../components/search-bar/search-bar.svelte'
  import Logo from '../components/logo/logo.svelte'
  import { quintOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'
  import appConfig from '../config/appConfig'
  import { SettingsOutline } from '../components/icon/nicons'
  import SearchIcon from '../n-icons/SearchIcon.svelte'
  import dayjs from 'dayjs'

  const {
    showController = false,
    editMode = false,
    editingLabel = undefined,
    editedUniboard = undefined,
    onToggleEditMode = () => {},
    onSaveEdits = () => {},
    boardAddMenu = [],
    onBoardTabTap = () => {},
    combinedBoards = [],
    searchFor = undefined,
    onSearchChange = () => {},
    onSearchClear = () => {},
    onOpenSearch = () => {},
    trackableCount = 0,
    deviceWidth = 0,
    runningTimers = [],
    onShowRunningTimers = () => {},
    alarmIcon = undefined,
  } = $props()
</script>

{#if showController}
  <div class="w-full">
    <TodayDateController />
  </div>
{/if}

{#if editMode}
  <div
    transition:slide|global={{ delay: 250, duration: 300, easing: quintOut }}
    class="flex bg-ios-card items-center justify-center space-x-4 px-4 py-2"
  >
    <!-- iOS look: Close is the neutral fill, Save the tint (not red: red is for destructive actions) -->
    <Button size="sm" shape="round" className="bg-ios-fill text-ios-label w-32" on:click={onToggleEditMode}>
      <span class="text-base">Close</span>
    </Button>
    {#if editedUniboard}
      <Button size="sm" shape="round" className="ml-2 bg-ios-tint text-ios-ontint w-32" on:click={onSaveEdits}>
        <span class="text-base">Save</span>
      </Button>
    {/if}
  </div>
{/if}

<!-- iOS look (same as the Timeline header): action row with the round board menu, then the large title -->
<!-- iOS look: a compact phone header (action row 36 px, toolbar 44 px) to leave more room for the trackers -->
<div class="glass relative z-50 px-4 pt-1">
  <div class="flex items-center justify-between h-9">
    <!-- iOS look (guide 6, Track): search and the board menu on the trailing edge; edit mode is in the board menu -->
    <span />
    {#if !editMode}
      <div class="flex items-center space-x-2">
        <button type="button" class="ios-round" aria-label="Search Nomie" on:click={onOpenSearch}>
          <IonIcon icon={SearchIcon} size={18} />
        </button>
        <MenuInline
          id="add-menu-button"
          title="Board options"
          x="right"
          y="bottom"
          menuButtons={boardAddMenu}
          buttonClass="ios-round"
        >
          <IonIcon icon={SettingsOutline} size={18} />
        </MenuInline>
      </div>
    {/if}
  </div>
  <h1 class="text-ios-large font-bold text-ios-label">Track</h1>
  <p class="text-ios-subhead text-ios-label2 -mt-1 pb-1">{dayjs().format('dddd D MMMM')}</p>
</div>

<!-- iOS look: in edit mode the row has room for the tab strip outline, which the row would otherwise clip -->
<div class="collapsible-row {editMode ? 'py-1' : ''}">
  <Toolbar className="stiff {editMode ? 'h-16 max-h-16 min-h-16' : 'h-11 max-h-11 min-h-11'}">
    <div class="flex items-center space-x-1">
      {#if !editMode}
        {#if runningTimers.length}
          <Button icon on:click={onShowRunningTimers}>
            <IonIcon className="text-ios-danger flex justify-center animate-pulse" size={30} icon={alarmIcon} />
          </Button>
        {/if}
      {/if}
    </div>

    {#if combinedBoards && combinedBoards.length > 1}
      <BoardTabs
        {editMode}
        className="w-full filler"
        {combinedBoards}
        activeBoard={$ActiveBoard}
        onSortBoards={saveSortedBoards}
        onDeleteBoard={deleteUniboard}
        on:tabTap={onBoardTabTap}
      />
    {:else}
      <div class="filler lg:hidden" />
      <Logo color={appConfig.primary_color} className="-mt-2 ml-2 mr-10" size={20} />
      <div class="filler" />
    {/if}

    {#if !editMode && trackableCount > 5 && deviceWidth > 699}
      <SearchBar style="max-width:220px;" compact on:clear={onSearchClear} on:change={onSearchChange} />
    {/if}
  </Toolbar>
</div>
