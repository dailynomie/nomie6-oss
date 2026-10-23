import { writable } from 'svelte/store'

/** True while the central radial menu is open. Other floating cards hide, so they don't sit on top of its items. */
export const RadialOpenStore = writable(false)
