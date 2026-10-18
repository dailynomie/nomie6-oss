import dayjs from 'dayjs'
import { LedgerStore, queryToUsageMap } from '../ledger/LedgerStore'
import type { ITrackables } from '../trackable/trackable-utils'
import { DAY_FORMAT, type DailyValues } from './experiment-data'

/** Days (YYYY-MM-DD) with at least one log between start and end, inclusive. */
export const loadActiveDays = async (start: dayjs.Dayjs, end: dayjs.Dayjs): Promise<Set<string>> => {
  const logs = await LedgerStore.query({ start: start.startOf('day'), end: end.endOf('day') })
  return new Set(logs.map((log: any) => log.endDayjs().format(DAY_FORMAT)))
}

/** One value per day for a tracker. A day without a value is left out. */
export const loadDailyValues = async (
  tag: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  known: ITrackables
): Promise<DailyValues> => {
  const usages = await queryToUsageMap({ start: start.startOf('day'), end: end.endOf('day') }, known)
  const values: DailyValues = {}
  const usage = usages[tag]
  if (usage) {
    const byDay = usage.byDay
    byDay.dates.forEach((date, i) => {
      const value = byDay.values[i]
      values[dayjs(date).format(DAY_FORMAT)] = isNaN(value) ? undefined : value
    })
  }
  return values
}
