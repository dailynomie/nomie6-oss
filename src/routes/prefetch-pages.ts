// After the Track board has loaded, the screens of the tab bar are loaded in the background, one at a time, so they open
// without a wait. It only runs on a fast connection that does not save data. The same import() later reuses the module.
// Plotly and the analytics page are not loaded here: Plotly is large, and the analytics page is rarely opened.
const SCREENS: Array<() => Promise<unknown>> = [
  () => import('./Timeline.svelte'),
  () => import('./Goals.svelte'),
  () => import('./Experiments.svelte'),
  () => import('./dashboard.svelte'),
]

const canPrefetch = (): boolean => {
  const connection = (navigator as any).connection
  if (connection?.saveData) return false
  if (connection?.effectiveType && connection.effectiveType !== '4g') return false
  return true
}

// waits for a quiet moment in the browser (a short timeout when the browser has no idle callback)
const whenIdle = (): Promise<void> =>
  new Promise((resolve) => {
    const w = window as any
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => resolve(), { timeout: 3000 })
    } else {
      setTimeout(resolve, 300)
    }
  })

const loadInTurn = async () => {
  for (const load of SCREENS) {
    await whenIdle()
    try {
      await load()
    } catch (e) {
      // a screen that cannot be loaded in the background is loaded when it is opened
      console.warn('a screen could not be prefetched', e)
    }
  }
}

export const schedulePrefetch = () => {
  if (!canPrefetch()) return
  const start = () => setTimeout(loadInTurn, 5000)
  if (document.readyState === 'complete') {
    start()
  } else {
    window.addEventListener('load', start, { once: true })
  }
}
