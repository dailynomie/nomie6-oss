<svelte:options runes={true} />

<script lang="ts">
    import Sortable from "./Sortable.svelte";
    import DraggableAttribute from "./DraggableAttribute.svelte";
    import { getSort } from "../Utilities";

    const { items, onChange, valueFilter, attrValues, sorters, menuLimit, onUpdate } = $props()

    const options = {
        group: "shared",
        ghostClass: "pvtPlaceholder",
        filter: ".pvtFilterBox",
        preventOnFilter: false,
    };

    function getAttrValues(x: string) {
        const values = attrValues[x] ?? {},
            sorter = getSort(sorters, x);
        return Object.keys(values).sort(sorter);
    }

    function updateValuesInFilter(attribute: string, values: any) {
        console.log('DnDCell.updateValuesInFilter:', attribute, values);
        valueFilter[attribute] = values;
        // Create new object reference so Svelte detects the change
        const newFilter = { ...valueFilter };
        console.log('DnDCell.updateValuesInFilter calling onUpdate with:', newFilter);
        onUpdate(newFilter);
    }
</script>

<Sortable {items} let:item={name} on:change={(ev) => onChange(ev.detail)} {options}>
    <DraggableAttribute
        attrValues={getAttrValues(name)}
        {name}
        valueFilter={valueFilter[name] || {}}
        {menuLimit}
        {updateValuesInFilter}
    />
</Sortable>
