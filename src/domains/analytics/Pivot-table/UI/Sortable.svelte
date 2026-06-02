<svelte:options runes={true} />

<script>
    import { createEventDispatcher } from 'svelte';
    import SortableAttachment from './SortableAttachment';

    const dispatch = createEventDispatcher();

    const { options = {}, items = [] } = $props();

    function createSortableAction(node) {
        const action = SortableAttachment(options, (val) => dispatch('change', val));
        return action(node);
    }
</script>

<div use:createSortableAction>
    {#each items as item}
        <slot {item} />
    {/each}
</div>
