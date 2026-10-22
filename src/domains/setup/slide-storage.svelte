<svelte:options runes={true} />

<script lang="ts">
  import Container from '../../components/container/container.svelte'

  import Menu from '../../components/menu/menu.svelte'
  import type { PopMenuButton } from '../../components/pop-menu/usePopmenu'

  import { Prefs } from '../preferences/Preferences'

  import { StorageEngines, type StorageTypes } from '../storage/storage'
  import { Lang } from '../../store/lang'

  const engines = StorageEngines
  let selected: StorageTypes = $state($Prefs.storageType)
  let showAdvanced: boolean = $state(false)

  let buttons = $derived.by(() => {
    return engines
      .map((engine) => {
        return {
          // the price is part of the title, and a disabled option says why (Phase 7 wording pass)
          title: `${engine.name} · ${engine.price}`,
          id: engine.id,
          disabled: ['firebase', 's3', 'nomie-server'].indexOf(engine.id) > -1 && !$Prefs.betaFeatures,
          description:
            ['firebase', 's3', 'nomie-server'].indexOf(engine.id) > -1 && !$Prefs.betaFeatures
              ? `${engine.description}. Not available yet`
              : engine.description,
          checked: `${selected}` == `${engine.id}`,
          click() {
            //@ts-ignore
            selected = engine.id
            $Prefs.storageType = selected
          },
        }
      })
      .filter((e) => {
        if (showAdvanced) {
          return true
        } else {
          return e.id !== 'pouchdb'
        }
      })
  })
</script>

<Container className="filler  flex items-center lg:justify-center flex-col pt-3 px-5 slide-storage ">
  <div class="max-w-screen-lg mx-auto pt-6">
    <h1 class="leading-tight text-ios-label text-center font-bold px-4 text-xl">
      {Lang.t('setup.data-storage', 'Data Storage')}
    </h1>
    <p class="text-description text-center text-sm pt-1 px-1">
      {Lang.t('setup.where-would-you-like-your-data-stored', 'Where would you like your data stored?')}
    </p>
    <div class="h-4" />
    <Menu size="sm" className="border border-ios-separator" {buttons} />

    <div class="flex items-center justify-center pt-4">
      <button
        on:click={() => {
          showAdvanced = !showAdvanced
        }}
        class="nbtn-badge bg-ios-fill text-ios-label text-xs"
      >
        {#if showAdvanced}{Lang.t('setup.hide-advanced', 'Hide Advanced')}{:else}{Lang.t(
            'setup.show-advanced',
            'Show Advanced'
          )}{/if}
      </button>
    </div>
    <div class="h-20" />
  </div>
</Container>

<style global>
  .storage-select .n-menu .active {
    @apply ring-2 ring-ios-tint ring-inset;
  }
</style>
