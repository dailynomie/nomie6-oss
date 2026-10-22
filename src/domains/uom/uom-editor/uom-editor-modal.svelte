<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../../components/button/button.svelte'
  import IosSelect from '../../../components/ios-select/ios-select.svelte'
  import ToggleSwitch from '../../../components/toggle-switch/toggle-switch.svelte'
  import { closeModal } from '../../../components/backdrop/BackdropStore2'
  import { Interact } from '../../../store/interact'
  import { TrackableStore } from '../../trackable/TrackableStore'
  import { saveCustomUom, removeCustomUom } from '../custom-uom-store'
  import {
    CUSTOM_UOM_TYPES,
    findUomNameClash,
    formatCustomUom,
    newCustomUomKey,
    type CustomUomItem,
  } from '../uom-registry'

  // iOS look: a custom unit is made of a name, a category and an optional symbol shown next to the value.
  const { id, unit } = $props<{ id: string; unit?: CustomUomItem }>()

  let singular = $state(unit?.singular ?? '')
  let plural = $state(unit?.plural ?? '')
  let symbol = $state(unit?.symbol ?? '')
  let symbolAffix = $state<'pre' | 'post'>(unit?.symbolAffix ?? 'post')
  let symbolSpace = $state(unit?.symbolSpace ?? false)
  let type = $state<CustomUomItem['type']>(unit?.type ?? 'general')
  let saving = $state(false)

  const typeOptions = CUSTOM_UOM_TYPES.map((t) => ({ value: t.value, label: t.label }))
  const affixOptions = [
    { value: 'post', label: 'After the number' },
    { value: 'pre', label: 'Before the number' },
  ]

  // The plural defaults to the name with an "s" added (Bottle, Bottles). Type it to override, e.g. for irregular words.
  const defaultPlural = $derived(singular.trim() ? `${singular.trim()}s` : '')
  const effectivePlural = $derived(plural.trim() || defaultPlural)
  const clashName = $derived(
    singular.trim() ? findUomNameClash(singular.trim(), effectivePlural, unit?.key) : undefined
  )
  const canSave = $derived(singular.trim().length > 0 && !clashName && !saving)

  const draft: CustomUomItem = $derived({
    key: unit?.key ?? '',
    singular: singular.trim(),
    plural: effectivePlural,
    symbol: symbol.trim(),
    type,
    symbolAffix,
    symbolSpace,
  })
  const example = $derived(draft.symbol ? formatCustomUom(12, draft) : `12 ${effectivePlural.toLowerCase()}`)

  // Trackers that count in this unit. They refer to it by key, so editing the unit changes them too.
  const usage = $derived(
    unit ? Object.values($TrackableStore.trackables).filter((t: any) => t.tracker?.uom === unit.key).length : 0
  )

  const save = async () => {
    if (!canSave) return
    saving = true
    await saveCustomUom({ ...draft, key: unit?.key ?? newCustomUomKey() })
    saving = false
    closeModal(id)
  }

  const remove = async () => {
    if (!unit) return
    if (usage > 0) {
      await Interact.alert(
        'Unit in use',
        `${usage === 1 ? '1 tracker counts' : `${usage} trackers count`} in ${unit.plural}. Change ${usage === 1 ? 'it' : 'them'} to another unit first.`
      )
      return
    }
    const confirmed = await Interact.confirm('Delete this unit?', `${unit.plural} will be removed from the list.`)
    if (!confirmed) return
    await removeCustomUom(unit.key)
    closeModal(id)
  }
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        <Button clear primary on:click={() => closeModal(id)}>Cancel</Button>
      </div>
      <h2 class="ntitle">{unit ? 'Edit Unit' : 'New Unit'}</h2>
      <div slot="right">
        <Button clear primary disabled={!canSave} on:click={save}>Save</Button>
      </div>
    </ToolbarGrid>
  </header>

  <main class="p-4 space-y-6 text-ios-label">
    <section class="space-y-2">
      <div class="ios-card divide-y divide-ios-separator">
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <label for="uom-singular" class="shrink-0">Name</label>
          <input
            id="uom-singular"
            class="min-w-0 flex-1 text-right bg-transparent outline-none text-ios-label placeholder:text-ios-label2"
            placeholder="Bottle"
            bind:value={singular}
          />
        </div>
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <label for="uom-plural" class="shrink-0">Plural</label>
          <input
            id="uom-plural"
            class="min-w-0 flex-1 text-right bg-transparent outline-none text-ios-label placeholder:text-ios-label2"
            placeholder={defaultPlural || 'Bottles'}
            bind:value={plural}
          />
        </div>
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <span class="shrink-0">Category</span>
          <IosSelect bind:value={type} options={typeOptions} title="Category" ariaLabel="Category" />
        </div>
      </div>
      {#if clashName}
        <p class="text-xs text-ios-danger px-1">There is already a unit called {clashName}.</p>
      {/if}
    </section>

    <section class="space-y-2">
      <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2">Symbol</div>
      <div class="ios-card divide-y divide-ios-separator">
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <label for="uom-symbol" class="shrink-0">Symbol</label>
          <input
            id="uom-symbol"
            class="min-w-0 flex-1 text-right bg-transparent outline-none text-ios-label placeholder:text-ios-label2"
            placeholder="Optional, e.g. ml"
            bind:value={symbol}
          />
        </div>
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <span class="shrink-0">Symbol position</span>
          <IosSelect
            bind:value={symbolAffix}
            options={affixOptions}
            title="Symbol position"
            ariaLabel="Symbol position"
          />
        </div>
        <div class="px-4 py-3 flex items-center justify-between gap-3">
          <span class="shrink-0">Space before symbol</span>
          <ToggleSwitch bind:value={symbolSpace} />
        </div>
      </div>
      <p class="text-xs text-ios-label2 px-1">Example: {example}</p>
    </section>

    {#if unit}
      <div class="ios-card">
        <button type="button" class="w-full px-4 py-3 text-center text-ios-danger font-semibold" on:click={remove}>
          Delete Unit
        </button>
      </div>
    {/if}
  </main>
</BackdropModal>
