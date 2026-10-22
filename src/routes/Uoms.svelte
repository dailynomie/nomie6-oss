<svelte:options runes={true} />

<script lang="ts">
  import Layout from '../domains/layout/layout.svelte'
  import IonIcon from '../components/icon/ion-icon.svelte'
  import NBackButton from '../components/back-button/back-button.svelte'
  import { AddIcon, ChevronForwardOutline } from '../components/icon/nicons'
  import { getGroupedUoms } from '../domains/uom/uom-utils'
  import { CustomUomStore } from '../domains/uom/custom-uom-store'
  import { openUomEditor } from '../domains/uom/uom-editor/useUomModal'
  import type { CustomUomItem } from '../domains/uom/uom-registry'

  // iOS look (Phase 7): the units a tracker can measure by, grouped by type.
  // Built-in units are read-only; custom units are marked and can be edited or deleted.
  const groups = $derived(
    Object.entries(getGroupedUoms(true, $CustomUomStore)).sort(([a], [b]) => a.localeCompare(b))
  )
  const groupLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1)

  const editUnit = (unit: any) => {
    const item: CustomUomItem = {
      key: unit.key,
      singular: unit.singular,
      plural: unit.plural,
      symbol: unit.symbol || '',
      type: unit.type,
      symbolAffix: unit.symbolAffix || 'post',
      symbolSpace: !!unit.symbolSpace,
    }
    openUomEditor(item)
  }
</script>

<Layout checkIn={false}>
  <div slot="header" class="px-4 pt-1 pb-1">
    <div class="h-9 flex items-center justify-between">
      <NBackButton to="/settings" />
      <button type="button" class="ios-round" aria-label="New unit" on:click={() => openUomEditor()}>
        <IonIcon icon={AddIcon} size={18} />
      </button>
    </div>
    <h1 class="text-ios-large font-bold text-ios-label">Units of Measure</h1>
    <p class="text-ios-subhead text-ios-label2">Trackers can count in these units.</p>
  </div>

  <main class="px-4 py-4 space-y-6 max-w-screen-lg mx-auto">
    {#each groups as [type, units]}
      <section>
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-2">{groupLabel(type)}</div>
        <div class="ios-card divide-y divide-ios-separator">
          {#each units as unit (unit.key)}
            {#if unit.custom}
              <button
                type="button"
                class="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                aria-label="Edit {unit.plural}"
                on:click={() => editUnit(unit)}
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-ios-label truncate">{unit.plural}</span>
                    <span class="text-ios-caption2 font-semibold rounded-md px-1.5 py-0.5 bg-ios-tintsoft text-ios-tint shrink-0">Custom</span>
                  </div>
                  <div class="text-ios-footnote text-ios-label2 truncate">{unit.singular}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-ios-subhead text-ios-label2">{unit.symbol || ''}</span>
                  <IonIcon icon={ChevronForwardOutline} className="text-ios-label2" size={16} />
                </div>
              </button>
            {:else}
              <div class="px-4 py-3 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold text-ios-label truncate">{unit.plural}</div>
                  <div class="text-ios-footnote text-ios-label2 truncate">{unit.singular}</div>
                </div>
                <div class="text-ios-subhead text-ios-label2 shrink-0">{unit.symbol || ''}</div>
              </div>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  </main>
</Layout>
