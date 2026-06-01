<svelte:options runes={true} />

<script>
    import { untrack } from 'svelte';
    import Plotly from './UI/Plotly.svelte';
    import { PivotData } from './Utilities';
    import { Prefs } from '../../preferences/Preferences'

    const props = $props();
    const { plotlyOptions = {}, plotlyConfig = {}, onRendererUpdate, traceOptions = {}, layoutOptions = {}, transpose = false } = props;

    let currentwidth = $state(500);
    let screenratio = $state(1);
    let plotbgcolor = $state('#ffffff')
    let paperbgcolor = $state('#ffffff')
    let plottextcolor = $state('#000000')
    let theme = $state($Prefs.theme);
    if (theme == 'dark') {
        plotbgcolor = '#0D324F';
        paperbgcolor = '#0D324F';
        plottextcolor = 'ffffff';

    }

    // Use ResizeObserver to dynamically update chart width when container resizes
    let resizeObserver;
    $effect(() => {
        // Try to find the table container for accurate width
        const findContainer = () => {
            // First try to find the parent table
            let container = document.querySelector('.pvtUi');
            if (!container) {
                container = document.querySelector('.pvtOutput');
            }
            if (!container) {
                container = document.querySelector('.scrolling-wrapper');
            }
            // If still no container, use a wider parent
            if (!container || container.clientWidth < 150) {
                container = document.body;
            }
            return container;
        };

        const container = findContainer();

        if (container && typeof ResizeObserver !== 'undefined') {
            // Use ResizeObserver to track container width changes
            resizeObserver = new ResizeObserver(() => {
                // Calculate available width: full body width minus left panel
                const bodyWidth = document.body.clientWidth;
                // Estimate left panel width (attributes columns)
                const leftPanelWidth = 200;
                const newWidth = Math.max(bodyWidth - leftPanelWidth - 40, 300);
                if (newWidth !== currentwidth && newWidth > 150) {
                    currentwidth = newWidth;
                }
            });
            resizeObserver.observe(window);

            // Set initial width
            const bodyWidth = document.body.clientWidth;
            const leftPanelWidth = 200;
            const initialWidth = Math.max(bodyWidth - leftPanelWidth - 40, 300);
            if (initialWidth > 150 && initialWidth !== currentwidth) {
                currentwidth = initialWidth;
            }
        } else {
            // Fallback for older browsers
            currentwidth = window.innerWidth - 300;
        }

        screenratio = window.innerHeight / window.innerWidth;

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    })



    let pivotData = $state(undefined);
    let rowKeys = $state([]);
    let colKeys = $state([]);
    let traceKeys = $state([]);
    let datumKeys = $state([]);
    let numInputs = $state(0);
    let data = $state([]);
    let hAxisTitle = $state('');
    let groupByTitle = $state('');
    let layout = $state({});

    let recomputeKey = $state(0);

    $effect(() => {
        // Access props and transpose to establish dependencies
        const currentProps = props;
        const currentTranspose = transpose;

        // Untrack all state writes to prevent effect from re-running when it modifies state
        untrack(() => {
            pivotData = new PivotData(currentProps);
            rowKeys = pivotData.getRowKeys();
            colKeys = pivotData.getColKeys();
            traceKeys = currentTranspose ? colKeys : rowKeys;
            if (traceKeys.length === 0) {
                traceKeys.push([]);
            }
            datumKeys = currentTranspose ? rowKeys : colKeys;
            if (datumKeys.length === 0) {
                datumKeys.push([]);
            }

            let fullAggName = pivotData.props.aggregatorName;
            numInputs = pivotData.props.aggregators[fullAggName]([])().numInputs || 0;
            if (numInputs !== 0) {
                fullAggName += ` of ${pivotData.props.vals.slice(0, numInputs).join(', ')}`;
            }
            data = traceKeys.map((traceKey) => {
                const values = [];
                const labels = [];
                for (const datumKey of datumKeys) {
                    const val = parseFloat(
                        pivotData
                            .getAggregator(currentTranspose ? datumKey : traceKey, currentTranspose ? traceKey : datumKey)
                            .value()
                    );
                    values.push(isFinite(val) ? val : null);
                    labels.push(datumKey.join('-') || ' ');
                }
                const trace = { name: traceKey.join('-') || fullAggName };
                if (traceOptions.type === 'pie') {
                    trace.values = values;
                    trace.labels = labels.length > 1 ? labels : [fullAggName];
                } else {
                    trace.x = currentTranspose ? values : labels;
                    trace.y = currentTranspose ? labels : values;
                }
                return Object.assign(trace, traceOptions);
            });

            let titleText = fullAggName;
            hAxisTitle = currentTranspose ? pivotData.props.rows.join('-') : pivotData.props.cols.join('-');
            groupByTitle = currentTranspose ? pivotData.props.cols.join('-') : pivotData.props.rows.join('-');
            if (hAxisTitle !== '') {
                titleText += ` vs ${hAxisTitle}`;
            }
            if (groupByTitle !== '') {
                titleText += ` by ${groupByTitle}`;
            }

            layout = {
                title: titleText,
                hovermode: 'closest',
                xaxis: {fixedrange: true},
                yaxis: {fixedrange: true},
                /* eslint-disable no-magic-numbers */
                //width: window.innerWidth / getSizeFactor(window.innerWidth),
                width: currentwidth,
                //height: window.innerHeight / getSizeFactor(window.innerHeight),
                height:currentwidth * screenratio,
                dragmode:false,
                plot_bgcolor: plotbgcolor,
                paper_bgcolor: paperbgcolor,
                font: {size:18 / (1400/currentwidth),color:plottextcolor},
                legend: {"orientation": "h"},
                margin: {
        l: 0,
        r: 0,
        b: 100,
        t: 100,
        pad: 4
      },
                //autosize:true,
                /* eslint-enable no-magic-numbers */
            };


            if (traceOptions.type === 'pie') {
                const columns = Math.ceil(Math.sqrt(data.length));
                const rows = Math.ceil(data.length / columns);
                layout.grid = { columns, rows };
                data.forEach((d, i) => {
                    d.domain = {
                        row: Math.floor(i / columns),
                        column: i - columns * Math.floor(i / columns),
                    };
                    if (data.length > 1) {
                        d.title = d.name;
                    }
                });
                if (data[0].labels.length === 1) {
                    layout.showlegend = false;
                }
            } else {
                layout.xaxis = {
                    title: currentTranspose ? fullAggName : null,
                    automargin: true,
                };
                layout.yaxis = {
                    title: currentTranspose ? null : fullAggName,
                    automargin: true,
                };
            }
        });
    })

    // Separate effect for layout updates that depend on currentwidth
    $effect(() => {
        // This effect depends on currentwidth and layout data
        // When currentwidth changes, update the layout dimensions
        if (layout && Object.keys(layout).length > 0) {
            layout.width = currentwidth;
            layout.height = currentwidth * screenratio;
            layout.font = {size: 18 / (1400/currentwidth), color: plottextcolor};
            // Trigger Plotly update by reassigning layout
            layout = layout;
        }
    })
</script>

<Plotly
    {data}
    layout={Object.assign(layout, layoutOptions, plotlyOptions)}
    config={plotlyConfig}
    onUpdate={onRendererUpdate}
/>
