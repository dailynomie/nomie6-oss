import dayjs from 'dayjs'
import { loadActiveDays, loadDailyValues } from '../experiments/experiment-query'
import type { DailyValues } from '../experiments/experiment-data'
import type { ITrackables } from '../trackable/trackable-utils'
import { buildReview, REVIEW_DAYS, type Review, type TrackerWeek } from './weekly-review'

const sumOf = (values: DailyValues): number => Object.values(values).reduce((sum, v) => sum + (v ?? 0), 0)

/** The last 7 days against the 7 before: the days with any log, and each tracker's total in both weeks. */
export const loadReview = async (known: ITrackables): Promise<Review> => {
  const end = dayjs().endOf('day')
  const start = dayjs().startOf('day').subtract(REVIEW_DAYS - 1, 'day')
  const previousEnd = start.subtract(1, 'day').endOf('day')
  const previousStart = start.subtract(REVIEW_DAYS, 'day')

  const activeNow = await loadActiveDays(start, end)
  const activeBefore = await loadActiveDays(previousStart, previousEnd)

  const trackers: Array<TrackerWeek> = []
  for (const trackable of Object.values(known) as Array<any>) {
    if (trackable.type !== 'tracker' || !trackable.tracker) continue
    const tag = trackable.tracker.tag
    const now = await loadDailyValues(tag, start, end, known)
    const before = await loadDailyValues(tag, previousStart, previousEnd, known)
    trackers.push({ tag, label: `${trackable.label}`, total: sumOf(now), previous: sumOf(before) })
  }

  return buildReview({ days: activeNow.size, previousDays: activeBefore.size, trackers })
}
