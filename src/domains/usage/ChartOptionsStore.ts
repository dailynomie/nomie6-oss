import { writable } from 'svelte/store'
import type { Trackable } from '../trackable/Trackable.class'
import Storage from '../storage/storage'

type ChartOptions = {
  type: 'bar' | 'line'
  startWithZero: boolean
  ignoreZero:boolean
  stats: 'none' | "avg" | 'sma-7' | 'sma-15' | 'sma-30' | 'ema-7' | 'ema-15' | 'ema-30' | 'split-11' | 'split-12' | 'split-13' | 'cumm'
  include: Trackable
  showContext: boolean
}
export type ChartOptionsStoreState = {
  [key: string]: ChartOptions
}

let chartOptionsCache: ChartOptionsStoreState = {}

export const saveChartOptions = async (id: string, options: ChartOptions) => {
  chartOptionsCache[id] = options
  // Save to CouchDB via Storage for multi-device sync
  await Storage.put('chart-options.json', chartOptionsCache)
  console.log('[ChartOptionsStore] Saved chart options for chart:', id)
}

export const getChartOption = (id: string): ChartOptions | undefined => {
  return chartOptionsCache[id]
}

export const getChartOptions = (): ChartOptionsStoreState => {
  return chartOptionsCache
}

/**
 * Register change listener for chart options to enable real-time sync
 * When chart options are updated on other devices via CouchDB,
 * this function ensures the app detects and handles those changes.
 */
export const registerChartOptionsListener = async () => {
  try {
    console.log('[ChartOptionsStore] Registering change listener for chart options')

    // Register listener for chart option changes from CouchDB sync
    Storage.get('chart-options.json', (changedOptions: ChartOptionsStoreState) => {
      console.log('[ChartOptionsStore] Chart options update detected from CouchDB sync')
      console.log('[ChartOptionsStore] Updated chart IDs:', Object.keys(changedOptions || {}))

      // Update the cache with synced options
      if (changedOptions) {
        chartOptionsCache = changedOptions
        ChartOptionsStore.set(chartOptionsCache)
        console.log('[ChartOptionsStore] Chart options updated from CouchDB sync')
      }
    })

    // Load initial options from Storage
    const initialOptions = await Storage.get('chart-options.json')
    if (initialOptions) {
      chartOptionsCache = initialOptions
      ChartOptionsStore.set(chartOptionsCache)
      console.log('[ChartOptionsStore] Initial chart options loaded from storage:', Object.keys(initialOptions).length, 'charts')
    }

    console.log('[ChartOptionsStore] Chart options listener initialized')
  } catch (e) {
    console.error('[ChartOptionsStore] Error registering chart options listener:', e)
  }
}

export const ChartOptionsStore = writable<ChartOptionsStoreState>(chartOptionsCache)
