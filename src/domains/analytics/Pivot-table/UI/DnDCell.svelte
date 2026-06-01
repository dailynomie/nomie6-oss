<svelte:options runes={true} />

<script>
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

    let x;

    function getAttrValues(x) {
        const values = attrValues[x] ?? {},
            sorter = getSort(sorters, x);
        return Object.keys(values).sort(sorter);
    }

    function updateValuesInFilter(attribute, values) {
        valueFilter[attribute] = values;
        onUpdate(valueFilter);
    }
</script>

<Sortable {items} let:item={x} on:change={(ev) => onChange(ev.detail)} {options}>
    <DraggableAttribute
        attrValues={getAttrValues(x)}
        name={x}
        valueFilter={valueFilter[x] || {}}
        {menuLimit}
        {updateValuesInFilter}
    />
</Sortable>
