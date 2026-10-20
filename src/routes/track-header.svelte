<svelte:options runes={true} />

<script lang="ts">
  import TodayDateController from '../domains/usage/today-date-controller.svelte'
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
    class="flex bg-white dark:bg-black items-center justify-center space-x-4 px-4 py-2"
  >
    <Button size="sm" shape="round" className="bg-red-500 text-white w-32" on:click={onToggleEditMode}>
      <span class="text-base">Close</span>
    </Button>
    {#if editedUniboard}
      <Button
        size="sm"
        shape="round"
        className="ml-2 bg-primary-500 text-white w-32"
        on:click={onSaveEdits}
      >
        <span class="text-base">Save</span>
      </Button>
    {/if}
  </div>
{/if}

<!-- iOS look (same as the Timeline header): action row with the round board menu, then the large title -->
<div class="glass px-4 pt-2">
  <div class="flex items-center justify-end h-11">
    {#if !editMode}
      <MenuInline id="add-menu-button" title="Board options" x="right" y="bottom" menuButtons={boardAddMenu} buttonClass="ios-round">
        <IonIcon icon={SettingsOutline} size={18} />
      </MenuInline>
    {/if}
  </div>
  <h1 class="text-ios-large font-bold text-ios-label mt-1">Track</h1>
</div>

<Toolbar className="stiff h-14 max-h-14 min-h-14">
  <div class="flex items-center space-x-1">
    {#if !editMode}
      {#if runningTimers.length}
        <Button icon on:click={onShowRunningTimers}>
          <IonIcon className="text-red-500 flex justify-center animate-pulse" size={30} icon={alarmIcon} />
        </Button>
      {/if}
    {/if}
  </div>

  {#if combinedBoards && combinedBoards.length > 1}
    <BoardTabs
      editMode={editMode}
      className="w-full filler"
      on:tabTap={onBoardTabTap}
    />
  {:else}
    <div class="filler lg:hidden" />
    <Logo color={appConfig.primary_color} className="-mt-2 ml-2 mr-10" size={20} />
    <div class="filler" />
  {/if}

  {#if !editMode && trackableCount > 5 && deviceWidth > 699}
    <SearchBar
      style="max-width:220px;"
      compact
      on:clear={onSearchClear}
      on:change={onSearchChange}
    />
  {/if}

</Toolbar>
