import { writable } from 'svelte/store'

export const TimelineStartDate = writable<Date>(new Date())
