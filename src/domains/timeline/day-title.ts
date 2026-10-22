import dayjs, { type Dayjs } from 'dayjs'

/**
 * Day headings on the Timeline (iOS look, Phase 7): Today, Yesterday, a weekday within the last week,
 * then the medium date (for example "Oct 10, 2026"). Pure so it can be unit tested.
 */
export const isRelativeDayTitle = (day: Dayjs, now: Dayjs = dayjs()): boolean => {
  const today = now.startOf('day')
  const target = day.startOf('day')
  return target.isSame(today, 'day') || target.isSame(today.subtract(1, 'day'), 'day') || target.isAfter(today.subtract(7, 'day'))
}

export const dayTitle = (day: Dayjs, mediumFormat: string, now: Dayjs = dayjs()): string => {
  const today = now.startOf('day')
  const target = day.startOf('day')
  if (target.isSame(today, 'day')) return 'Today'
  if (target.isSame(today.subtract(1, 'day'), 'day')) return 'Yesterday'
  if (isRelativeDayTitle(day, now)) return target.format('dddd')
  return target.format(mediumFormat)
}
