<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Prefs } from '../../../preferences/Preferences'
  import { openDateOptionPopMenu, openPopMenu, type PopMenuButton } from '../../../../components/pop-menu/usePopmenu'
  import IonIcon from '../../../../components/icon/ion-icon.svelte'
  import { ChevronExpandOutline } from '../../../../components/icon/nicons'

  const dispatch = createEventDispatcher()

  let { current = $bindable(), values = [] } = $props()

  let open = $state(false)
  const toggle = () => (open = !open)
  let fontsize = $state(Math.round(14 / (1400 / window.innerWidth)))
  if (fontsize < 10) {
    fontsize = 10
  }
  let leftcolumnsize = $state(Math.round(200 / (1400 / window.innerWidth)))
  if (leftcolumnsize < 65) {
    leftcolumnsize = 65
  }

  let theme = $Prefs.theme
  let cssVarStyles = $state('')
  // iOS look: menus are cards with label text, in light and dark mode
  cssVarStyles =
    '--ddicon:var(--ios-label2);--ddcurrent:var(--ios-card);--ddmenu:var(--ios-card);--ddactive:var(--ios-fill);--ddfont:var(--ios-label)'
  /// NEW
  const showMenu = () => {
    let createlist = []
    values.forEach(function (item, index) {
      createlist.push({
        title: item,
        checked: item == current,
        click() {
          if (current !== item) dispatch('change', (current = item))
        },
      })
    })
    const buttons: Array<PopMenuButton> = createlist

    openPopMenu({
      id: 'rendere-menu',
      buttons,
    })
  }
</script>

<!-- iOS look: a pill button with the chart or table type and a chevron; the choices open in an action sheet -->
<div class="pvtDropdown ios-chooser-wrap" style={cssVarStyles}>
  <button
    type="button"
    class="ios-chooser"
    aria-label="Chart or table type"
    aria-expanded={open}
    on:click={() => {
      showMenu()
    }}
  >
    <span class="ios-chooser-label">{current || ' '}</span>
    <IonIcon icon={ChevronExpandOutline} size={14} />
  </button>
</div>

<style>
  .ios-chooser-wrap {
    display: block;
    margin: 0;
    width: 100%;
  }
  .ios-chooser {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: var(--ios-fill);
    color: var(--ios-label);
    font-size: 15px;
    font-weight: 500;
    text-align: left;
  }
  .ios-chooser:active {
    opacity: 0.7;
  }
  .ios-chooser-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ios-chooser :global(svg) {
    color: var(--ios-label2);
    flex-shrink: 0;
  }
</style>
