<svelte:options runes={true} />

<script lang="ts">
  import { Prefs } from '../../../preferences/Preferences'
  // viewOnly (phones): only the chart or table chooser and the output, no field, aggregator or drag and drop cells
  const { horizUnused, viewOnly = false } = $props()
  let theme = $state($Prefs.theme)

  // iOS look: the table's own surface and text come from the tokens
  let cssVarStyles = '--bg:var(--ios-card);--border:var(--ios-separator);--fontcolor:var(--ios-label)'
</script>

{#if viewOnly}
  <table class="pvtUi pvtViewOnly" style={cssVarStyles}>
    <tbody>
      <tr>
        <td class="pvtRenderers"><slot name="rendererCell" /></td>
      </tr>
      <tr>
        <td class="pvtOutput"><div class="scrolling-wrapper"><slot name="outputCell" /></div></td>
      </tr>
    </tbody>
  </table>
{:else if horizUnused}
  <table class="pvtUi" style={cssVarStyles}>
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
  <table class="pvtUi" style={cssVarStyles}>
    <tbody>
      <tr>
        <td class="pvtRenderers"><slot name="rendererCell" /></td>
        <td class="pvtVals"><slot name="aggregatorCell" /></td>
        <td class="pvtAxisContainer pvtHorizList pvtCols"><slot name="colAttrsCell" /></td>
      </tr>
      <tr>
        <td class="pvtAxisContainer pvtUnused pvtVertList"><slot name="unusedAttrsCell" /></td>
        <td class="pvtAxisContainer pvtVertList pvtRows"><slot name="rowAttrsCell" /></td>
        <td class="pvtOutput"><div class="scrolling-wrapper"><slot name="outputCell" /></div></td>
      </tr>
    </tbody>
  </table>
{/if}

<style>
  /* view only (phones): the table and the chart use the full width, so the chart is readable */
  .pvtViewOnly {
    width: 100%;
  }
  .pvtViewOnly td.pvtOutput {
    width: 100%;
  }
  .pvtViewOnly .scrolling-wrapper {
    width: 100%;
  }
  .scrolling-wrapper {
    overflow-x: scroll;
    overflow-y: hidden;
    white-space: nowrap;
    max-width: 100%;
  }
</style>
