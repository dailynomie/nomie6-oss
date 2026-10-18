import dayjs from 'dayjs'
import type { MissingDayRule } from './experiment-class'

/**
 * Pure shaping of daily values for an experiment. No storage access here, so this can be tested directly.
 * Days are 'YYYY-MM-DD' strings.
 */

export const DAY_FORMAT = 'YYYY-MM-DD'

export type DailyValues = { [day: string]: number | undefined }
export type Adherence = { [day: string]: number | undefined } // 1 = kept to it, -1 = did not, undefined = no check-in

export const shiftDay = (day: string, days: number): string => dayjs(day).add(days, 'day').format(DAY_FORMAT)

/** `count` consecutive days starting at `start`. */
export const daysFrom = (start: string, count: number): Array<string> =>
  Array.from({ length: count }, (_, i) => shiftDay(start, i))

/** The `count` days immediately before `start`. */
export const baselineDaysBefore = (start: string, count: number): Array<string> => daysFrom(shiftDay(start, -count), count)

/**
 * One value per day for the given days.
 * Only active days count: a day with no logs at all tells us nothing, so it is always left out.
 * A missing value is 0 for counts ('zero') and left out for ratings ('skip').
 */
export const dailySeries = (
  days: Array<string>,
  values: DailyValues,
  activeDays: Set<string>,
  missingAs: MissingDayRule
): { [day: string]: number } => {
  const series: { [day: string]: number } = {}
  days.forEach((day) => {
    if (!activeDays.has(day)) return
    const value = values[day]
    if (value !== undefined && value !== null && Number.isFinite(value)) {
      series[day] = value
    } else if (missingAs === 'zero') {
      series[day] = 0
    }
  })
  return series
}

/** The series values for the given days, in day order, leaving out days with no value. */
export const valuesInOrder = (days: Array<string>, series: { [day: string]: number }): Array<number> =>
  days.filter((day) => series[day] !== undefined).map((day) => series[day])

/**
 * The outcome values during the experiment: only the days the user kept to the change.
 * With a lag, a day's change is compared with the outcome on the following day.
 */
export const selectExperimentDays = (
  days: Array<string>,
  adherence: Adherence,
  series: { [day: string]: number },
  lagDays: number = 0
): Array<number> =>
  days
    .filter((day) => adherence[day] === 1)
    .map((day) => series[shiftDay(day, lagDays)])
    .filter((value): value is number => value !== undefined)

/** How often the user kept to the change over the experiment days. */
export const summarizeAdherence = (days: Array<string>, adherence: Adherence): { kept: number; missed: number; unchecked: number } => {
  let kept = 0
  let missed = 0
  let unchecked = 0
  days.forEach((day) => {
    const value = adherence[day]
    if (value === 1) kept++
    else if (value === -1) missed++
    else unchecked++
  })
  return { kept, missed, unchecked }
}

/**
 * The before and during values for one outcome.
 * With a lag, both windows are shifted by the lag, so the outcome is read on the following day.
 */
export const outcomeWindows = (input: {
  days: Array<string>
  baselineDays: Array<string>
  values: DailyValues
  activeDays: Set<string>
  missingAs: MissingDayRule
  lagDays?: number
  adherence: Adherence
}): { before: Array<number>; during: Array<number> } => {
  const lag = input.lagDays ?? 0
  const shift = (days: Array<string>) => days.map((day) => shiftDay(day, lag))
  const series = dailySeries([...shift(input.baselineDays), ...shift(input.days)], input.values, input.activeDays, input.missingAs)
  return {
    before: valuesInOrder(shift(input.baselineDays), series),
    during: selectExperimentDays(input.days, input.adherence, series, lag),
  }
}
