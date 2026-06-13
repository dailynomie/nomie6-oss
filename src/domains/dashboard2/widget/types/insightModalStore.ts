import { writable } from 'svelte/store'

export const insightModalData = writable({
  id: '',
  insight: '',
  promptLabel: '',
  lastFetchDate: null as string | null,
})
