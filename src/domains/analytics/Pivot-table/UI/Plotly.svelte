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

    function create(node, options) {
        // Use untrack to avoid re-running the action when Plotly updates DOM via proxy
        untrack(() => {
            Plotly.newPlot(node, options.data, options.layout, options.config);
        });

        return {
            update(newOptions) {
                // Also untrack here to prevent feedback loops
                untrack(() => {
                    Plotly.newPlot(node, newOptions.data, newOptions.layout, newOptions.config);
                });
            },
            destroy() {
                Plotly.purge(node);
            },
        };
    }
</script>

{#if Plotly}
    <div use:create={{ data, layout, config }} />
{:else}
    <p>Error! Plotly.js not initialized.</p>
{/if}
