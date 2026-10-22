<svelte:options runes={true} />

<script lang="ts">
  import Layout from '../domains/layout/layout.svelte'
  import { getGroupedUoms } from '../domains/uom/uom-utils'

  // iOS look (Phase 7): the units a tracker can measure by, grouped by type, read-only.
  // Custom units are not built yet, so there is no add button here.
  const groups = Object.entries(getGroupedUoms()).sort(([a], [b]) => a.localeCompare(b))
  const groupLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1)
</script>

<Layout checkIn={false}>
  <div slot="header" class="px-4 pt-1 pb-1">
    <div class="h-9"></div>
    <h1 class="text-ios-large font-bold text-ios-label">Units of Measure</h1>
    <p class="text-ios-subhead text-ios-label2">Trackers can count in these units.</p>
  </div>

  <main class="px-4 py-4 space-y-6 max-w-screen-lg mx-auto">
    {#each groups as [type, units]}
      <section>
        <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-2">{groupLabel(type)}</div>
        <div class="ios-card divide-y divide-ios-separator">
          {#each units as unit (unit.key)}
            <div class="px-4 py-3 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-ios-label truncate">{unit.plural}</div>
                <div class="text-ios-footnote text-ios-label2 truncate">{unit.singular}</div>
              </div>
              <div class="text-ios-subhead text-ios-label2 shrink-0">{unit.symbol || ''}</div>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </main>
</Layout>
