<svelte:options runes={true} />

<script context="module">
  let zIndexGlobal = 1000
</script>

<script>
  import { createEventDispatcher } from 'svelte'
  import { Prefs } from '../../../preferences/Preferences'
  import IonIcon from '../../../../components/icon/ion-icon.svelte'
  import { CloseOutline, CheckmarkOutline } from '../../../../components/icon/nicons'

  const dispatch = createEventDispatcher()
  const { name, values, valueFilter: initialValueFilter = {}, menuLimit = 500 } = $props()

  let valueFilter = $state(initialValueFilter)

  let filterText = $state('')

  let shown = $derived(values.filter(matchesFilter))

  let theme = $state($Prefs.theme)
  let cssVarStyles = $state('')
  // iOS look: the same chip tokens in light and dark mode
  cssVarStyles = '--btbg:var(--ios-fill);--btborder:transparent;--fontcolor:var(--ios-label)'

  function toggleValue(value) {
    value in valueFilter ? removeValuesFromFilter([value]) : addValuesToFilter([value])
    dispatch('change', valueFilter)
  }

  function setValuesInFilter(vals) {
    Object.keys(valueFilter).forEach((key) => delete valueFilter[key])
    addValuesToFilter(vals)
    dispatch('change', valueFilter)
  }

  function addValuesToFilter(vals) {
    vals.forEach((v) => (valueFilter[v] = true))
  }

  function removeValuesFromFilter(vals) {
    vals.forEach((v) => delete valueFilter[v])
  }

  function matchesFilter(x) {
    return x.toLowerCase().trim().includes(filterText.toLowerCase().trim())
  }

  function selectOnly(ev, value) {
    ev.preventDefault()
    ev.stopPropagation()
    setValuesInFilter(values.filter((y) => y !== value))
  }

  function select(all) {
    const func = all ? removeValuesFromFilter : addValuesToFilter
    return function (ev) {
      ev.stopPropagation()
      func(values.filter(matchesFilter))
    }
  }

  function init(node) {
    node.style.zIndex = '' + zIndexGlobal++
  }
</script>

<!-- iOS look: a sheet with a grabber, a title with a round close button, a search field, pill actions and tinted check rows -->
<div class="pvtFilterBox" style:display="block" style:cursor="initial" use:init>
  <div class="ios-sheet-grabber"><span class="pvtDragHandle" aria-label="Move"></span></div>
  <div class="ios-sheet-head">
    <span class="ios-sheet-title">{name}</span>
    <button type="button" class="pvtCloseX ios-sheet-close" aria-label="Close">
      <IonIcon icon={CloseOutline} size={16} />
    </button>
  </div>

  {#if values.length < menuLimit}
    <div class="ios-sheet-search">
      <input type="search" placeholder="Filter values" class="pvtSearch" bind:value={filterText} />
    </div>
    <div class="ios-sheet-actions">
      <button type="button" class="ios-pill" onclick={select(true)}>
        Select {values.length === shown.length ? 'All' : shown.length}
      </button>
      <button type="button" class="ios-pill" onclick={select(false)}>
        Deselect {values.length === shown.length ? 'All' : shown.length}
      </button>
    </div>

    <div class="pvtCheckContainer ios-sheet-list">
      {#each shown as x (x)}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <p onclick={() => toggleValue(x)} class="ios-row" style={cssVarStyles}>
          <span class="ios-row-check" aria-hidden="true">
            {#if !(x in valueFilter)}<IonIcon icon={CheckmarkOutline} size={18} />{/if}
          </span>
          <span class="ios-row-label"
            >{#if x === ''}<em>null</em>{:else}{x}{/if}</span
          >
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <a class="pvtOnly ios-only" onclick={(ev) => selectOnly(ev, x)} role="button" tabindex="0"> only </a>
        </p>
      {/each}
    </div>
  {:else}
    <p class="ios-sheet-note">(too many values to show)</p>
  {/if}
</div>

<style>
  .pvtFilterBox {
    width: min(calc(100vw - 32px), 360px);
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background: var(--ios-card);
    border: 0;
    border-radius: 14px;
    box-shadow: var(--ios-shadow-float);
    overflow: hidden;
    text-align: left;
    font-family: -apple-system, system-ui, sans-serif;
  }
  .ios-sheet-grabber {
    display: flex;
    justify-content: center;
    padding-top: 6px;
  }
  .ios-sheet-grabber .pvtDragHandle {
    display: block;
    width: 36px;
    height: 5px;
    border-radius: 3px;
    background: var(--ios-separator);
    cursor: grab;
  }
  .ios-sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 16px 10px;
  }
  .ios-sheet-title {
    font-size: 17px;
    line-height: 22px;
    font-weight: 600;
    color: var(--ios-label);
  }
  .ios-sheet-close {
    position: static;
    width: 28px;
    height: 28px;
    border-radius: 14px;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ios-fill);
    color: var(--ios-label2);
    flex-shrink: 0;
  }
  .ios-sheet-search {
    padding: 0 16px 8px;
  }
  .ios-sheet-search input {
    width: 100%;
    height: 36px;
    border: 0;
    border-radius: 10px;
    padding: 0 12px;
    background: var(--ios-fill);
    color: var(--ios-label);
    font-size: 17px;
    outline: none;
  }
  .ios-sheet-search input::placeholder {
    color: var(--ios-label2);
  }
  .ios-sheet-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px 10px;
  }
  .ios-pill {
    height: 32px;
    padding: 0 14px;
    border: 0;
    border-radius: 16px;
    background: var(--ios-fill);
    color: var(--ios-tint);
    font-size: 15px;
    font-weight: 500;
  }
  /* the pivot stylesheet has hover colours for buttons; the sheet keeps its own */
  .ios-pill,
  .ios-pill:hover,
  .ios-pill:active,
  .ios-pill:focus {
    background: var(--ios-fill);
    color: var(--ios-tint);
    border-color: transparent;
  }
  .ios-sheet-list {
    border-top: 0.5px solid var(--ios-separator);
    overflow-y: auto;
    max-height: 50vh;
    white-space: normal;
    width: 100%;
  }
  .ios-sheet-list :global(p.ios-row) {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin: 0;
    padding: 0 16px;
    background: var(--ios-card);
    border-bottom: 0.5px solid var(--ios-separator);
    color: var(--ios-label);
    font-size: 17px;
    cursor: pointer;
  }
  .ios-row-check {
    width: 20px;
    color: var(--ios-tint);
    display: flex;
    justify-content: center;
  }
  .ios-row-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ios-only {
    float: none;
    display: inline !important;
    width: auto;
    font-size: 13px;
    color: var(--ios-tint);
    padding: 0 0 0 8px;
  }
  .ios-sheet-note {
    padding: 12px 16px;
    color: var(--ios-label2);
    font-size: 15px;
  }
</style>
