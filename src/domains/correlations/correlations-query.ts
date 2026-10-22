import dayjs from 'dayjs'
import { loadDailyValues } from '../experiments/experiment-query'
import type { DailyValues } from '../experiments/experiment-data'
import type { ITrackables } from '../trackable/trackable-utils'

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
