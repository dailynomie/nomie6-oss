<svelte:options runes={true} />

<script>
    import { createEventDispatcher } from 'svelte';
    import sortableAttachment from './SortableAttachment';

    const dispatch = createEventDispatcher();

    const { options = {}, items = [] } = $props();
</script>

<div use:sortableAttachment={sortableAttachment(options, (val) => dispatch('change', val))}>
    {#each items as item}
        <slot {item} />
    {/each}
</div>
