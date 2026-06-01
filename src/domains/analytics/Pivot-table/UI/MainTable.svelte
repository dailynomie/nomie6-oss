<svelte:options runes={true} />

<script lang="ts">
    import { Prefs } from '../../../preferences/Preferences'
    const { horizUnused } = $props();
    let theme = $state($Prefs.theme);

    let cssVarStyles = $derived.by(() => {
        if (theme === 'dark') {
            const bgdark = '#000000';
            const border = '#2A303C';
            const fontcolor = "#ffffff";
            return `--bg:${bgdark};--border:${border};--fontcolor:${fontcolor}`;
        } else {
            const bglight = '#ffffff';
            const border = '#CCCCCC';
            const fontcolor = "#000000";
            return `--bg:${bglight};--border:${border};--fontcolor:${fontcolor}`;
        }
    });



</script>
<style>
    :global(.pvtUi) {
        width: 100%;
        border-collapse: collapse;
    }

    :global(.pvtOutput) {
        width: 100%;
        flex: 1;
    }

    .scrolling-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        width: 100%;
        height: 100%;
    }
   </style>

{#if horizUnused}
    <table class="pvtUi" style='{cssVarStyles}'>
        <tbody>
            <tr>
                <td class="pvtRenderers"><slot name="rendererCell" /></td>
                <td class="pvtAxisContainer pvtUnused pvtHorizList"><slot name="unusedAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtVals"><slot name="aggregatorCell" /></td>
                <td class="pvtAxisContainer pvtHorizList pvtCols"><slot name="colAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtAxisContainer pvtVertList pvtRows"><slot name="rowAttrsCell" /></td>
                <td class="pvtOutput"><div class="scrolling-wrapper"><slot name="outputCell" /></div></td>
            </tr>
        </tbody>
    </table>
{:else}
    <table class="pvtUi">
        <tbody>
            <tr>
                <td class="pvtRenderers"><slot name="rendererCell" /></td>
                <td class="pvtVals"><slot name="aggregatorCell" /></td>
                <td class="pvtAxisContainer pvtHorizList pvtCols"><slot name="colAttrsCell" /></td>
            </tr>
            <tr>
                <td class="pvtAxisContainer pvtUnused pvtVertList"><slot name="unusedAttrsCell" /></td>
                <td class="pvtAxisContainer pvtVertList pvtRows"><slot name="rowAttrsCell" /></td>
                <td class="pvtOutput"><slot name="outputCell" /></td>
            </tr>
        </tbody>
    </table>
{/if}
