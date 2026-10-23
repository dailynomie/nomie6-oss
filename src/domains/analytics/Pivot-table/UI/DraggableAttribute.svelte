<svelte:options runes={true} />

<script>
  import Draggable from './Draggable.svelte'
  import FilterBox from './FilterBox.svelte'
  import { Prefs } from '../../../preferences/Preferences'
  import { Lang } from '../../../../store/lang'

  const is_empty = (obj) => !obj || Object.keys(obj).length === 0

  const { valueFilter, name, attrValues, menuLimit, updateValuesInFilter } = $props()

  let open = $state(false)
  let fontsize = $state(Math.round(14 / (1400 / window.innerWidth)))
  if (fontsize < 12) {
    fontsize = 12
  }

  // iOS look: attribute chips use the fill token; search terms use the tint
  let cssVarStyles = $derived(
    name.includes('🕵🏻‍♂️')
      ? '--btbg:var(--ios-tint-soft);--btborder:transparent;--fontcolor:var(--ios-tint)'
      : '--btbg:var(--ios-fill);--btborder:transparent;--fontcolor:var(--ios-label)'
  )

  const toggleOpen = () => (open = !open)
</script>

<li data-id={name} draggable="true" style="padding:2px;cursor:move">
  <span
    class={`pvtAttr ${is_empty(valueFilter) ? '' : 'pvtFilteredAttribute'}`}
    style="font-size:{fontsize}px;{cssVarStyles}"
  >
    {name}
    <button type="button" class="pvtTriangle" aria-label={Lang.t('analytics.show-filter', 'Filter values')} on:click={toggleOpen}>
      {' '}
      ▾
    </button>
  </span>
</li>
{#if open}
  <Draggable handle=".pvtDragHandle" close=".pvtCloseX" on:click={toggleOpen} on:close={toggleOpen}>
    <FilterBox
      {name}
      {valueFilter}
      values={attrValues}
      {menuLimit}
      on:change={(ev) => updateValuesInFilter(name, ev.detail)}
    />
  </Draggable>
{/if}
