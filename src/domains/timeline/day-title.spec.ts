import { describe, expect, test } from 'vitest'
import dayjs from 'dayjs'
import { dayTitle, isRelativeDayTitle } from './day-title'

const now = dayjs('2026-10-22T10:00:00')
const MEDIUM = 'MMM D, YYYY'

describe('dayTitle', () => {
  test('today and yesterday', () => {
    expect(dayTitle(dayjs('2026-10-22T08:00:00'), MEDIUM, now)).toBe('Today')
    expect(dayTitle(dayjs('2026-10-21T20:00:00'), MEDIUM, now)).toBe('Yesterday')
  })
  test('a weekday within the last week', () => {
    expect(dayTitle(dayjs('2026-10-19T12:00:00'), MEDIUM, now)).toBe('Monday')
    expect(dayTitle(dayjs('2026-10-16T12:00:00'), MEDIUM, now)).toBe('Friday')
    // seven days back is past the weekday range
    expect(dayTitle(dayjs('2026-10-15T12:00:00'), MEDIUM, now)).toBe('Oct 15, 2026')
  })
  test('the medium date for older days, with no weekday', () => {
    expect(dayTitle(dayjs('2026-10-10T12:00:00'), MEDIUM, now)).toBe('Oct 10, 2026')
    expect(isRelativeDayTitle(dayjs('2026-10-10T12:00:00'), now)).toBe(false)
  })
})
