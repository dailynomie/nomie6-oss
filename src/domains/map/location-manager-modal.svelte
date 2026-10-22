<svelte:options runes={true} />

<script lang="ts">
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'

  import NMap from './map-lazy.svelte'

  import NItem from '../../components/list-item/list-item.svelte'

  import { Interact } from '../../store/interact'

  import Location from '../locations/LocationClass'
  import locate from '../../modules/locate/locate'
  import math from '../../utils/math/math'

  import { Lang } from '../../store/lang'
  import Button from '../../components/button/button.svelte'

  import Spinner from '../../components/spinner/spinner.svelte'
  import List from '../../components/list/list.svelte'
  import Divider from '../../components/divider/divider.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { CheckmarkCircle, MenuOutline, StarFilled } from '../../components/icon/nicons'
  import RemoveCircle from '../../n-icons/RemoveCircle.svelte'
  import SortableList2 from '../../components/sortable-list/sortable-list2.svelte'
  import {
    LocationStore,
    lookupLocationToLocation,
    type LookupLocationType,
    searchForLocations,
  } from '../locations/LocationStore'
  import SearchBar from '../../components/search-bar/search-bar.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'

  import StarSolid from '../../n-icons/StarSolid.svelte'
  import { wait } from '../../utils/tick/tick'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import { showToast } from '../../components/toast/ToastStore'

  let state = $state({
    locations: [],
    active: null,
    mode: 'edit',
    mapLocation: null,
    locating: false,
  })

  let lastLocation = $state(null)
  let mapLocation = $state(null)
  let showMap = $state(false)
  let locationSearchTerm = $state<string | undefined>(undefined)
  let resultsHidden = $state(true)
  let searchResults = $state<Array<LookupLocationType>>([])
  let ready = $state(true)
  let sortedTimeout = $state<any>(undefined)
  let saving = $state(false)

  const { id, onSelect } = $props()

  $effect(() => {
    if ($LocationStore) {
      state.locations = $LocationStore
    }
  })

  // function goto(location) {
  //   state.active = location;
  //   state.mapLocation = null;
  // }

  const close = async () => {
    closeModal(id)
  }

  /**
   * If Location changes
   */
  // $: if (mapLocation || state.active) {
  //   let loc = !mapLocation ? new Location(state.active) : new Location(mapLocation)
  //   let exists = state.locations.find((l) => l.hash == loc.hash) ? true : false
  //   // showFavoriteButton = !exists
  // }

  function sorted(evt): void {
    clearTimeout(sortedTimeout)
    if (state.mode == 'edit') {
      saving = true
      let locations = evt.detail
      sortedTimeout = setTimeout(() => {
        LocationStore.updateSync((state) => {
          return locations
        }).then(() => {
          saving = false
        })
      }, 300)
    }
  }

  const setViewMode = async (view) => {
    ready = false
    state.mode = view
    await wait(100)
    ready = true
  }

  function mapChange(evt) {
    let location = evt.detail
    if (lastLocation !== location.hash) {
      lastLocation = location.hash
      mapLocation = location
    }
  }

  async function unfavorite(location) {
    let confirmed = await Interact.confirm(
      Lang.t('map.remove-location-2', 'Remove Location?'),
      Lang.t('map.you-can-add-it-later', 'You can add it later')
    )
    if (confirmed) {
      state.mode = 'view'
      ready = false
      await LocationStore.remove(location)
      await wait(100)
      setViewMode('edit')
    }
    // removing = false
  }

  async function currentLocation() {
    state.locating = true
    try {
      let rawLoc: any = await locate()
      if (rawLoc) {
        let location = new Location({
          lat: rawLoc.latitude,
          lng: rawLoc.longitude,
          name: rawLoc.location,
        })
        select(location)
      }
    } catch (e) {
      Interact.error(Lang.t('map.unable-to-get-your-location', 'Unable to get your location'))
    }
    state.locating = false
  }

  async function rename(location) {
    let name = await Interact.prompt(Lang.t('map.new-name', 'New Name'), null, {
      value: location.name,
    })
    if (name) {
      location.name = name
      LocationStore.upsert(location)
    }
  }

  function select(location) {
    if ($Interact.locationFinder.onInteract) {
      $Interact.locationFinder.onInteract(location)
    }
    if (onSelect) {
      onSelect(location)
    }
    close()
  }

  async function favorite(item?: Location) {
    ready = false
    let loc
    if (item || mapLocation) {
      loc = item || mapLocation
    } else if (state.active) {
      loc = state.active
    }

    if (loc) {
      if (!loc.name) {
        let name = await Interact.prompt(Lang.t('map.name-this-location', '📍 Name this location'), null, {
          value: loc.name,
        })
        loc.name = name
      }
      if (loc.name) {
        Interact.blocker(Lang.t('map.saving-location', { name: loc.name }))
        await LocationStore.upsert(loc)
        Interact.stopBlocker()
        showToast({ message: Lang.t('map.location-saved', 'Location Saved') })
      }
    }
    ready = true
  }

  const search = async (term: string) => {
    let networkResults = await searchForLocations(term)
    let localResults = $LocationStore
      .filter((l: Location) => {
        return JSON.stringify(l).toLowerCase().search(term.toLowerCase()) > -1
      })
      .map((l: Location) => {
        return {
          name: l.name,
          lat: l.lat,
          lng: l.lng,
          magicKey: null,
          saved: true,
        }
      })

    searchResults = [...localResults, ...networkResults]
  }

  const addLocationByResultItem = async (item: LookupLocationType) => {
    const location = await lookupLocationToLocation(item)
    if (location && !item.saved) {
      await favorite(location)
    }
    if (state.mode == 'view') {
      select(location)
    }
    //select(location)
    resultsHidden = true
  }
</script>

<BackdropModal className="h-full bg-ios-card w-full">
  <header slot="header" class="bg-ios-card relative pb-2 shadow-md z-40">
    <ToolbarGrid className="w-full stiff">
      <div slot="left"></div>
      <h1 class="ntitle">
        {#if state.active}
          {state.active.name}
        {:else if state.mapLocation}
          {state.mapLocation.lat},{state.mapLocation.lng}
        {:else}{Lang.t('map.locations', 'Locations')}{/if}
      </h1>
      <div slot="right" class="flex items-center space-x-2">
        <!-- iOS look: the empty placeholder action is removed; only the saving spinner shows here -->
        {#if state.mode == 'edit' && saving}
          <Spinner size={24} />
        {/if}
        <Button on:click={close} clear primary>{Lang.t('general.done', 'Done')}</Button>
      </div>
    </ToolbarGrid>
    <div class="searchbar-results relative">
      <SearchBar
        bind:searchTerm={locationSearchTerm}
        on:focus={() => {
          resultsHidden = false
        }}
        on:blur={() => {
          resultsHidden = true
        }}
        on:change={(evt) => {
          search(evt.detail)
        }}
      />
      {#if searchResults.length && locationSearchTerm?.length && !resultsHidden}
        <div value={1} class="absolute left-4 right-4 top-8 z-50">
          <List solo className="my-2  shadow-lg ring-1 ring-ios-separator">
            {#each searchResults as locationType, index}
              <ListItem
                bottomLine={24}
                autofocus
                on:click={() => {
                  addLocationByResultItem(locationType)
                }}
              >
                <div slot="left">
                  {#if locationType.saved}
                    <IonIcon icon={StarSolid} className="text-ios-star" />
                  {/if}
                </div>
                {locationType.name}
              </ListItem>
            {/each}
          </List>
        </div>
      {/if}
    </div>
  </header>

  <main class="pt-4 pb-4 flex-grow overflow-y-auto">
    <section class="flex flex-col h-full relative">
      {#if showMap}
        <div style="height:225px;" class="flex-grow-0 flex-shrink-0 relative">
          <!-- MAP -->
          <div style="height: 200px;" class="relative">
            <NMap hideFavorite on:change={mapChange} locations={state.active ? [state.active] : []} picker={true} />
          </div>
        </div>
      {/if}
      <!-- List Panel -->
      <div class="flex-grow flex-shrink h-full overflow-y-auto">
        <div class="list-wrapper px-2 lg:px-4 space-y-4">
          {#if mapLocation && mapLocation.lat}
            <List solo className="mb-2">
              <NItem
                bottomLine={18}
                clickable
                aria-label={Lang.t('map.save-this-location', 'Save this Location')}
                on:click={() => {
                  favorite(mapLocation)
                }}
              >
                {Lang.t('map.save-as-favorite', 'Save as Favorite:')}
                <strong>{math.round(mapLocation.lat, 10000)},{math.round(mapLocation.lng, 10000)}</strong>
              </NItem>
            </List>
          {/if}
          <List solo className="mb-2">
            <NItem
              clickable
              on:click={() => {
                showMap = !showMap
              }}>{Lang.t('map.find-on-map', 'Find on Map...')}</NItem
            >
          </List>

          {#if state.locations.length == 0}
            <Empty className="text-ios-label2">
              {Lang.t('general.no-favorites-found', 'No Favorites Found')}
            </Empty>
          {/if}

          {#if ready}
            <List solo>
              <SortableList2
                key="id"
                direction="y"
                enabled={state.mode == 'edit'}
                bind:items={state.locations}
                handleClass="menu"
                on:update={sorted}
                let:item
              >
                <div class="item-wrapper">
                  <!-- Edit -->
                  {#if state.mode === 'edit'}
                    <!-- iOS edit mode (guide 11.2): the red minus removes on the leading edge, the row opens its editor, and the reorder grip is on the trailing edge -->
                    <NItem bottomLine={14} className="bg-ios-card" clickable on:click={() => rename(item)}>
                      <div slot="left" class="flex items-center stiff">
                        <button
                          type="button"
                          aria-label={Lang.t('map.remove-location', 'Remove location')}
                          class="mr-3"
                          on:click|preventDefault|stopPropagation={() => unfavorite(item)}
                        >
                          <IonIcon icon={RemoveCircle} size={24} className="text-ios-danger" />
                        </button>
                      </div>

                      <h2 class="text-ios-body font-semibold text-ios-label text-left">
                        {item.name}
                        {#if state.active && item.hash == state.active.hash}
                          <IonIcon icon={CheckmarkCircle} className="text-ios-tint" />
                        {/if}
                      </h2>

                      <div slot="right" class="menu flex items-center">
                        <IonIcon icon={MenuOutline} className="text-ios-label2" />
                      </div>
                    </NItem>
                  {:else}
                    <NItem
                      clickable
                      bottomLine={14}
                      className=" bg-ios-card"
                      on:click={() => {
                        if (state.mode == 'view') {
                          select(item)
                        }
                      }}
                    >
                      <div slot="left">
                        <IonIcon icon={StarFilled} className="text-ios-star" size={22} />
                      </div>
                      <h2 class="text-base font-bold leading-tight text-ios-label">
                        {item.name}
                        {#if state.active && item.hash == state.active.hash}
                          <IonIcon icon={CheckmarkCircle} className="fill-primary" />
                        {/if}
                      </h2>
                    </NItem>
                  {/if}
                </div>
              </SortableList2>
            </List>
          {/if}
        </div>
      </div>
    </section>
  </main>
</BackdropModal>
