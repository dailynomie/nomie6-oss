<svelte:options runes={true} />

<script>
    import { createEventDispatcher } from 'svelte';
    import sortableAttachment from './SortableAttachment';

    const dispatch = createEventDispatcher();

    const { options = {}, items = [], key } = $props();
</script>

<div use:sortableAttachment={{ options, onchange: (val) => dispatch('change', val) }}>
    {#each items as item, i (key && typeof item === 'object' ? item[key] : typeof item !== 'object' ? item : i)}
        <slot {item} />
    {/each}
</div>
