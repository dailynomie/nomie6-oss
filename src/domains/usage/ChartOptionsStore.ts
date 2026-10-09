import { writable } from 'svelte/store'
import type { Trackable } from '../trackable/Trackable.class'

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

export const saveChartOptions = (id: string, options: ChartOptions) => {
  console.log('[ChartOptionsStore] saveChartOptions called for id:', id)
  console.log('[ChartOptionsStore] options.include:', options.include)
  const existing = getChartOptions()
  existing[id] = options
  const jsonData = JSON.stringify(existing)
  console.log('[ChartOptionsStore] Saving to localStorage, full data:', jsonData)
  localStorage.setItem('chart-options', jsonData)
}

export const getChartOption = (id: string): ChartOptions | undefined => {
  return getChartOptions()[id]
}

export const getChartOptions = (): ChartOptionsStoreState => {
  try {
    const base = localStorage.getItem('chart-options') || '{}'
    return JSON.parse(base)
  } catch (e) {
    return {}
  }
}

export const ChartOptionsStore = writable<ChartOptionsStoreState>(getChartOptions())
