<svelte:options runes={true} />

<script lang="ts">
    import { clickOutside } from "./utils";
    import { createEventDispatcher } from "svelte";
    import { Prefs } from '../../../preferences/Preferences'

    const dispatch = createEventDispatcher();

    const { current, values = [] } = $props())

    let open = $state(false);
    const toggle = () => (open = !open);
    let fontsize = Math.round(14 /(1400/window.innerWidth));
    if (fontsize < 10) {fontsize=10}
    let leftcolumnsize = Math.round(200 /(1400/window.innerWidth));
    if (leftcolumnsize < 65) {leftcolumnsize=65}

    let theme = $Prefs.theme;
    let cssVarStyles = "";
    // iOS look: menus are cards with label text, in light and dark mode
    cssVarStyles = "--ddicon:var(--ios-label2);--ddcurrent:var(--ios-card);--ddmenu:var(--ios-card);--ddactive:var(--ios-fill);--ddfont:var(--ios-label)";


</script>

<div class="pvtDropdown" use:clickOutside on:outside={() => (open = false)} style='{cssVarStyles}'>
    <button
        on:click|stopPropagation={toggle}
        class={"pvtDropdownValue pvtDropdownCurrent " + (open ? "pvtDropdownCurrentOpen" : "")} style="font-size:{fontsize}px;width:{leftcolumnsize}px"
    >
        <div class="pvtDropdownIcon">{open ? "×" : "▾"}</div>
        {#if current}
            {current}
        {:else}
            <span>&nbsp;</span>
        {/if}
    </button>

    {#if open}
        <div class="pvtDropdownMenu" style="z-index: 100">
            {#each values as r (r)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div style="font-size:{fontsize-2}px"
                    role="button"
                    on:click|stopPropagation={() => {
                        if (current !== r) dispatch("change", (current = r));
                        toggle();
                    }}
                    class="pvtDropdownValue"
                    class:pvtDropdownActiveValue={r === current}
                >
                    {r}
                </div>
            {/each}
        </div>
    {/if}
</div>
