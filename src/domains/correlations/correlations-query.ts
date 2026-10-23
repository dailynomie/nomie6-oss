import dayjs from 'dayjs'
import { loadDailyValues } from '../experiments/experiment-query'
import { DAY_FORMAT, type DailyValues } from '../experiments/experiment-data'
import { queryToUsageMap } from '../ledger/LedgerStore'
import type { ITrackables } from '../trackable/trackable-utils'
import { MIN_LINK_DAYS } from './link-finder'

/** The links are looked for in the last 90 days. */
export const WINDOW_DAYS = 90

/** One value per day for each of the two trackers, over the window that ends today. */
export const loadPair = async (
  tagA: string,
  tagB: string,
  known: ITrackables
): Promise<{ a: DailyValues; b: DailyValues }> => {
  const end = dayjs()
  const start = end.subtract(WINDOW_DAYS - 1, 'day')
  const [a, b] = await Promise.all([
    loadDailyValues(tagA, start, end, known),
    loadDailyValues(tagB, start, end, known),
  ])
  return { a, b }
}

/** One item that can be linked: a tracker, person, context or pointer, with its value for each day. */
export type LinkItem = { key: string; label: string; type: string; series: DailyValues }

/**
 * Every item with enough days, from one query over the window: the background analysis of Find links.
 * The key is the tag with its prefix (#coffee, @em, +work, ^healthy), as the usage map has it.
 */
export const loadLinkItems = async (known: ITrackables): Promise<Array<LinkItem>> => {
  const end = dayjs().endOf('day')
  const start = dayjs().startOf('day').subtract(WINDOW_DAYS - 1, 'day')
  const usages = await queryToUsageMap({ start, end }, known)
  const items: Array<LinkItem> = []
  for (const [key, usage] of Object.entries(usages)) {
    const trackable: any = known[key]
    if (!trackable || !usage?.byDay) continue
    const series: DailyValues = {}
    usage.byDay.dates.forEach((date: Date, i: number) => {
      const value = usage.byDay.values[i]
      series[dayjs(date).format(DAY_FORMAT)] = isNaN(value) ? undefined : value
    })
    if (Object.keys(series).length >= MIN_LINK_DAYS) {
      items.push({ key, label: `${trackable.label}`, type: `${trackable.type}`, series })
    }
  }
  return items
}
