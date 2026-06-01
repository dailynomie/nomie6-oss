<script context="module">
    let Plotly;

    export function initPlotly(module) {
        Plotly = module;
    }
</script>

<svelte:options runes={true} />

<script>
    import { untrack } from 'svelte';

    const { data, layout, config } = $props()
    const onUpdate = () => {}; // TODO: connect to plotly events

    function create(node) {
        // Use untrack to avoid re-running the action when Plotly updates DOM via proxy
        untrack(() => {
            Plotly.newPlot(node, data, layout, config);
        });

        return {
            update() {
                // Also untrack here to prevent feedback loops
                untrack(() => {
                    Plotly.newPlot(node, data, layout, config);
                });
            },
            destroy() {
                Plotly.purge(node);
            },
        };
    }
</script>

{#if Plotly}
    <div use:create />
{:else}
    <p>Error! Plotly.js not initialized.</p>
{/if}
