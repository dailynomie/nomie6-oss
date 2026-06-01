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
        // Clone data and layout to prevent Plotly's internal mutations from triggering reactivity
        untrack(() => {
            Plotly.newPlot(
                node,
                structuredClone(options.data),
                structuredClone(options.layout),
                options.config
            );
        });

        return {
            update(newOptions) {
                // Clone to prevent Plotly's mutations (e.g., deleteProperty) from triggering reactive updates
                untrack(() => {
                    Plotly.newPlot(
                        node,
                        structuredClone(newOptions.data),
                        structuredClone(newOptions.layout),
                        newOptions.config
                    );
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
