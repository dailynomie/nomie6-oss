<svelte:options runes={true} />

<script>
    import { createEventDispatcher } from 'svelte';
    import sortableAttachment from './SortableAttachment';

    const dispatch = createEventDispatcher();

    const { options = {}, items = [] } = $props();
</script>

<div use:sortableAttachment={{ options, onchange: (val) => dispatch('change', val) }}>
    {#each items as item}
        <slot {item} />
    {/each}
</div>
