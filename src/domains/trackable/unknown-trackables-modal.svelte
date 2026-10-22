<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { showToast } from '../../components/toast/ToastStore'
  import { Interact } from '../../store/interact'
  import {
    createUnknownTrackable,
    deleteUnknownTrackable,
    findUnknownTrackables,
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

  const remove = async (item: UnknownItem) => {
    const confirmed = await Interact.confirm(
      `Delete ${item.key}?`,
      `The tag is removed from ${item.count} ${item.count === 1 ? 'note' : 'notes'}. This cannot be undone.`
    )
    if (!confirmed) return
    busy = true
    const changed = await deleteUnknownTrackable(item)
    busy = false
    showToast({ message: `Removed from ${changed} ${changed === 1 ? 'note' : 'notes'}` })
    await load()
  }
</script>

<BackdropModal className="h-full bg-ios-card w-full">
  <header slot="header" class="bg-ios-card relative pb-2 px-4 pt-2">
    <div class="flex items-center justify-between h-11">
      <button type="button" class="text-ios-tint text-base" onclick={() => closeModal(id)}>Close</button>
      <h1 class="text-base font-semibold text-ios-label">Unknown Trackables</h1>
      <span class="w-10"></span>
    </div>
  </header>

  <main class="px-4 pb-10 space-y-6">
    <p class="text-ios-footnote text-ios-label2">
      Tags in your notes that have no tracker, person, context or pointer yet. Create one to keep tracking it, or delete the tag from the notes that use it.
    </p>

    {#if loading}
      <p class="text-ios-label2 text-center py-8">Looking through your notes…</p>
    {:else if items.length === 0}
      <p class="text-ios-label2 text-center py-8">Nothing to set up. Every tag in your notes has a tracker, person, context or pointer.</p>
    {:else}
      {#each GROUPS as group}
        {@const groupItems = items.filter((i) => i.type === group.type)}
        {#if groupItems.length}
          <section>
            <div class="text-xs font-semibold uppercase tracking-wide text-ios-label2 mb-2">{group.label}</div>
            <div class="ios-card divide-y divide-ios-separator">
              {#each groupItems as item (item.key)}
                <div class="p-4 flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-semibold text-ios-label truncate">{item.key}</div>
                    <div class="text-ios-footnote text-ios-label2">
                      {item.count} {item.count === 1 ? 'note' : 'notes'}
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button
                      type="button"
                      class="h-9 px-3 rounded-full bg-ios-tint text-ios-ontint text-sm font-medium disabled:opacity-50"
                      disabled={busy}
                      onclick={() => create(item)}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      class="h-9 px-3 rounded-full bg-ios-fill text-ios-danger text-sm font-medium disabled:opacity-50"
                      disabled={busy}
                      onclick={() => remove(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    {/if}
  </main>
</BackdropModal>
