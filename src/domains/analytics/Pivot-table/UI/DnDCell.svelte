<svelte:options runes={true} />

<script lang="ts">
    import { onMount } from "svelte";
    import DraggableAttribute from "./DraggableAttribute.svelte";
    import sortableAttachment from "./SortableAttachment";
    import { getSort } from "../Utilities";

    const { items, onChange, valueFilter, attrValues, sorters, menuLimit, onUpdate } = $props()

    const options = {
        group: "shared",
        ghostClass: "pvtPlaceholder",
        filter: ".pvtFilterBox",
        preventOnFilter: false,
        revertOnSpill: true,
        removeOnSpill: false,
    };

    let initialized = $state(false);
    let containerEl: HTMLElement;

    onMount(() => {
        initialized = true;
    });

    function getAttrValues(x: string) {
        const values = attrValues[x] ?? {},
            sorter = getSort(sorters, x);
        return Object.keys(values).sort(sorter);
    }

    function updateValuesInFilter(attribute: string, values: any) {
        valueFilter[attribute] = values;
        onUpdate(valueFilter);
    }
</script>

<div bind:this={containerEl}>
    <!-- Placeholder for sortable attachment -->
    {#if !initialized}
        <div {@attach sortableAttachment(options, onChange)}></div>
    {/if}

    <!-- Items rendered without keys -->
    {#each items as name}
        <DraggableAttribute
            attrValues={getAttrValues(name)}
            {name}
            valueFilter={valueFilter[name] || {}}
            {menuLimit}
            {updateValuesInFilter}
        />
    {/each}
</div>
