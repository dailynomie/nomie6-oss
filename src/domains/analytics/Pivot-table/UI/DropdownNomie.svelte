<svelte:options runes={true} />

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Prefs } from '../../../preferences/Preferences'
    import { openDateOptionPopMenu, openPopMenu, type PopMenuButton } from '../../../../components/pop-menu/usePopmenu'

    const dispatch = createEventDispatcher();

    let { current = $bindable(), values = [] } = $props();

    let open = $state(false);
    const toggle = () => (open = !open);
    let fontsize = $state(Math.round(14 /(1400/window.innerWidth)));
    if (fontsize < 10) {fontsize=10}
    let leftcolumnsize = $state(Math.round(200 /(1400/window.innerWidth)));
    if (leftcolumnsize < 65) {leftcolumnsize=65}

    let theme = $Prefs.theme;
    let cssVarStyles = $state("");
    // iOS look: menus are cards with label text, in light and dark mode
    cssVarStyles = "--ddicon:var(--ios-label2);--ddcurrent:var(--ios-card);--ddmenu:var(--ios-card);--ddactive:var(--ios-fill);--ddfont:var(--ios-label)";
/// NEW
const showMenu = () => {
    let createlist = [];
    values.forEach(function (item, index) {
    createlist.push({"title":item,"checked":item==current,click() {
        if (current !== item) dispatch("change", (current = item));
        },})
})
    const buttons:Array<PopMenuButton> = createlist;
    
    openPopMenu({
      id:"rendere-menu",
      buttons,
    })
  }

</script>

<div class="pvtDropdown" style='{cssVarStyles}'>
    <button
        
        class={"pvtDropdownValue pvtDropdownCurrent " + (open ? "pvtDropdownCurrentOpen" : "")} style="font-size:{fontsize}px;width:{leftcolumnsize}px"
        on:click={()=>{showMenu()}}
            
    >
        <div class="pvtDropdownIcon">{open ? "×" : "..."}</div>
        {#if current}
            {current}
        {:else}
            <span>&nbsp;</span>
        {/if}
    </button>

        
</div>
