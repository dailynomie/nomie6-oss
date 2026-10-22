<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { showToast } from '../../components/toast/ToastStore'
  import { Interact } from '../../store/interact'
  import { Prefs } from '../preferences/Preferences'
  import { Lang } from '../../store/lang'
  import {
    createUnknownTrackable,
    deleteUnknownTrackable,
    findUnknownTrackables,
    setUnknownTagIgnored,
    type UnknownItem,
    type UnknownType,
  } from './unknown-trackables'

  const { id } = $props<{ id: string }>()

  // Locations are not trackables in the app (they are places on a note, not a type of trackable), so they are not listed.
  const GROUPS: Array<{ type: UnknownType; label: string }> = [
    { type: 'tracker', label: 'Trackers' },
    { type: 'person', label: 'People' },
    { type: 'context', label: 'Contexts' },
    { type: 'pointer', label: 'Pointers' },
  ]

  let items: Array<UnknownItem> = $state([])
  let loading = $state(true)
  let busy = $state(false)
  // which groups are open: the active groups start open, the ignored groups start closed
  let open: Record<string, boolean> = $state({})

  const ignoredKeys = $derived($Prefs.ignoredUnknownTags || [])
  const activeItems = $derived(items.filter((i) => !ignoredKeys.includes(i.key)))
  const ignoredItems = $derived(items.filter((i) => ignoredKeys.includes(i.key)))

  const isOpen = (section: 'active' | 'ignored', type: UnknownType) =>
    open[`${section}-${type}`] ?? section === 'active'
  const toggle = (section: 'active' | 'ignored', type: UnknownType) => {
    open = { ...open, [`${section}-${type}`]: !isOpen(section, type) }
  }

  const load = async () => {
    loading = true
    items = await findUnknownTrackables()
    loading = false
  }

  onMount(load)

  const create = async (item: UnknownItem) => {
    busy = true
    const saved = await createUnknownTrackable(item)
    busy = false
    if (saved) showToast({ message: `${item.key} created` })
    await load()
  }

  // Ignore: the user confirmed this tag is not a tracker. Nothing in the notes changes.
  const ignore = (item: UnknownItem) => {
    setUnknownTagIgnored(item.key, true)
    showToast({ message: `${item.key} ignored` })
  }

  const restore = (item: UnknownItem) => {
    setUnknownTagIgnored(item.key, false)
    showToast({ message: `${item.key} is back in the list` })
  }

  const remove = async (item: UnknownItem) => {
    const confirmed = await Interact.confirm(
      `Delete ${item.key}?`,
      `The tag is removed from ${item.count} ${item.count === 1 ? 'note' : 'notes'}. This cannot be undone.`
    )
    if (!confirmed) return
    busy = true
    const changed = await deleteUnknownTrackable(item)
    setUnknownTagIgnored(item.key, false)
    busy = false
    showToast({ message: `Removed from ${changed} ${changed === 1 ? Lang.t('trackable.note', 'note') : Lang.t('trackable.notes-2', 'notes')}` })
    await load()
  }
</script>

<BackdropModal className="h-full bg-ios-card w-full">
  <header slot="header" class="bg-ios-card relative pb-2 px-4 pt-2">
    <div class="flex items-center justify-between h-11">
      <h1 class="text-base font-semibold text-ios-label">
        {Lang.t('trackable.unknown-trackables', 'Unknown Trackables')}
      </h1>
      <button type="button" class="text-ios-tint text-base font-semibold" onclick={() => closeModal(id)}
        >{Lang.t('trackable.done', 'Done')}</button
      >
    </div>
  </header>

  <main class="px-4 pb-10 space-y-6">
    <p class="text-ios-footnote text-ios-label2">
      {Lang.t(
        'trackable.tags-in-your-notes-that-have-no-tracker-person-c',
        'Tags in your notes that have no tracker, person, context or pointer yet. Create one to keep tracking it, ignore it if it should stay as it is, or delete the tag from the notes that use it.'
      )}
    </p>

    {#if loading}
      <p class="text-ios-label2 text-center py-8">
        {Lang.t('trackable.looking-through-your-notes', 'Looking through your notes…')}
      </p>
    {:else if items.length === 0}
      <p class="text-ios-label2 text-center py-8">
        {Lang.t(
          'trackable.nothing-to-set-up-every-tag-in-your-notes-has-a-',
          'Nothing to set up. Every tag in your notes has a tracker, person, context or pointer.'
        )}
      </p>
    {:else}
      {#each [{ section: 'active' as const, list: activeItems, title: 'To set up' }] as block}
        {#each GROUPS as group}
          {@const groupItems = block.list.filter((i) => i.type === group.type)}
          {#if groupItems.length}
            <section>
              <button
                type="button"
                class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-2"
                aria-expanded={isOpen(block.section, group.type)}
                onclick={() => toggle(block.section, group.type)}
              >
                <span>{group.label} ({groupItems.length})</span>
                <span aria-hidden="true">{isOpen(block.section, group.type) ? '▴' : '▾'}</span>
              </button>
              {#if isOpen(block.section, group.type)}
                <div class="ios-card divide-y divide-ios-separator">
                  {#each groupItems as item (item.key)}
                    <div class="p-4 space-y-3">
                      <div class="min-w-0">
                        <div class="font-semibold text-ios-label truncate">{item.key}</div>
                        <div class="text-ios-footnote text-ios-label2">
                          {item.count}
                          {item.count === 1 ? 'note' : 'notes'}
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="h-9 px-3 rounded-full bg-ios-tint text-ios-ontint text-sm font-medium disabled:opacity-50"
                          disabled={busy}
                          onclick={() => create(item)}>{Lang.t('trackable.create', 'Create')}</button
                        >
                        <button
                          type="button"
                          class="h-9 px-3 rounded-full bg-ios-fill text-ios-label text-sm font-medium disabled:opacity-50"
                          disabled={busy}
                          onclick={() => ignore(item)}>{Lang.t('trackable.ignore', 'Ignore')}</button
                        >
                        <button
                          type="button"
                          class="h-9 px-3 rounded-full bg-ios-fill text-ios-danger text-sm font-medium disabled:opacity-50"
                          disabled={busy}
                          onclick={() => remove(item)}>{Lang.t('trackable.delete', 'Delete')}</button
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}
        {/each}
      {/each}

      {#if ignoredItems.length}
        <div class="pt-2 text-xs font-semibold uppercase tracking-wide text-ios-label2">
          {Lang.t('trackable.ignored', 'Ignored')}
        </div>
        {#each GROUPS as group}
          {@const groupItems = ignoredItems.filter((i) => i.type === group.type)}
          {#if groupItems.length}
            <section>
              <button
                type="button"
                class="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-2"
                aria-expanded={isOpen('ignored', group.type)}
                onclick={() => toggle('ignored', group.type)}
              >
                <span>{group.label} ({groupItems.length})</span>
                <span aria-hidden="true">{isOpen('ignored', group.type) ? '▴' : '▾'}</span>
              </button>
              {#if isOpen('ignored', group.type)}
                <div class="ios-card divide-y divide-ios-separator">
                  {#each groupItems as item (item.key)}
                    <div class="p-4 space-y-3">
                      <div class="min-w-0">
                        <div class="font-semibold text-ios-label2 truncate">{item.key}</div>
                        <div class="text-ios-footnote text-ios-label2">
                          {item.count}
                          {item.count === 1 ? 'note' : 'notes'}
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="h-9 px-3 rounded-full bg-ios-fill text-ios-label text-sm font-medium disabled:opacity-50"
                          disabled={busy}
                          onclick={() => restore(item)}>{Lang.t('trackable.restore', 'Restore')}</button
                        >
                        <button
                          type="button"
                          class="h-9 px-3 rounded-full bg-ios-fill text-ios-danger text-sm font-medium disabled:opacity-50"
                          disabled={busy}
                          onclick={() => remove(item)}>{Lang.t('trackable.delete', 'Delete')}</button
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </section>
          {/if}
        {/each}
      {/if}
    {/if}
  </main>
</BackdropModal>
