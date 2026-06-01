<svelte:options runes={true} />

<script lang="ts">
    import TableRenderers from './TableRenderers';
    import { PivotClass } from '../pivot-class';
    import { aggregators as defaultAggregators } from '../Pivot-table/Utilities';

    const {
        renderer = TableRenderers.Table,
        pivotconfig: pivotconfigProp = undefined,
        getConfig = false,
        workingPivotId = "1dummy2",
        workingPivotTag = "Dummy",
        workingPivotEmoji = "🐣",
        workingPivotDefault = false,
        workingPivotDays = 90,
        workingPivotSearchTerm = {"enabled":false,terms:""},
        renderers = {},
        ...restProps
    } = $props();

    let pivotconfig = $state(pivotconfigProp);
    let aggregators = $state(defaultAggregators);

    // Build pivot config when getConfig changes
    $effect(() => {
        if (getConfig) {
            const config = { ...restProps, renderer };
            const currentconfig = new PivotClass({
                id: workingPivotId,
                tag: workingPivotTag,
                emoji: workingPivotEmoji,
                default: workingPivotDefault,
                days: workingPivotDays,
                searchterm: workingPivotSearchTerm,
                grouping: config.grouping,
                compactRows: config.compactRows,
                rowGroupBefore: config.rowGroupBefore,
                colGroupBefore: config.colGroupBefore,
                rendererName: Object.keys(renderers).find(key => renderers[key] === renderer) || "Table",
                aggregatorName: Object.keys(aggregators).find(key => aggregators[key] === config.aggregator) || "Count",
                hiddenAttributes: config.hiddenAttributes || [],
                hiddenFromAggregators: config.hiddenFromAggregators || [],
                hiddenFromDragDrop: config.hiddenFromDragDrop || [],
                unusedOrientationCutoff: config.unusedOrientationCutoff || 85,
                menuLimit: config.menuLimit || 500,
                options: {
                    "rows": config.rows || [],
                    "cols": config.cols || [],
                    "vals": config.vals || [],
                    "valueFilter": config.valueFilter || {},
                    "sorters": config.sorters || {},
                    "derivedAttributes": config.derivedAttributes,
                },
            });
            pivotconfig = currentconfig;
        }
    });
</script>


<div class="cont">
<svelte:component this={renderer} {pivotconfig} {...restProps} />
</div>

<style>
    .cont {
        width:100px;
    }
</style>
