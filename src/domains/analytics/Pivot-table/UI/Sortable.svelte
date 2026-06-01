<script context="module">
    // your script goes here
</script>

<svelte:options runes={true} />

<script>
    import Sortable from 'sortablejs';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const { options = {}, items = [] } = $props<{ options?: any, items?: any[] }>()

    function notify(el) {
        const val = [...el.children].map((i) => i.dataset.id);
        dispatch('change', val);
    }

    function create(node) {
        const sortable = Sortable.create(node.parentNode, {
            ...options,
            onUpdate: (ev) => notify(ev.to),
            onAdd: (ev) => notify(ev.to),
            // onRemove suppressed to prevent duplicate notifications during cross-container drags
            // The destination's onAdd is sufficient to update state
        });

        // Temporary node removal
        node.parentNode.removeChild(node);

        return {
            update() {},
            onDestroy() {
                sortable.destroy();
            },
        };
    }
</script>

<div use:create><!-- Temporary node only for the initialization. --></div>
{#each items as item (item)}
    <slot {item} />
{/each}
