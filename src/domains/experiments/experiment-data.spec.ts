import { describe, expect, it } from 'vitest'
import {
  baselineDaysBefore,
  daysFrom,
  dailySeries,
  outcomeWindows,
  selectExperimentDays,
  adherenceTagFor,
  shiftDay,
  summarizeAdherence,
  valuesInOrder,
} from './experiment-data'

const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']

describe('day windows', () => {
  it('builds consecutive days', () => {
    expect(daysFrom('2026-10-01', 3)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
  })

  it('builds the baseline immediately before the start, across a month boundary', () => {
    expect(baselineDaysBefore('2026-10-01', 2)).toEqual(['2026-09-29', '2026-09-30'])
    expect(shiftDay('2026-12-31', 1)).toEqual('2027-01-01')
  })
})

describe('daily series', () => {
  it('leaves out days without any logs, whatever the missing-day rule', () => {
    const active = new Set(['2026-10-01', '2026-10-03'])
    const values = { '2026-10-01': 4, '2026-10-02': 9, '2026-10-03': 5 }
    expect(dailySeries(days, values, active, 'zero')).toEqual({ '2026-10-01': 4, '2026-10-03': 5 })
    expect(dailySeries(days, values, active, 'skip')).toEqual({ '2026-10-01': 4, '2026-10-03': 5 })
  })

  it('uses 0 for a missing value on an active day when counting', () => {
    const active = new Set(days)
    expect(dailySeries(days, { '2026-10-01': 2 }, active, 'zero')).toEqual({
      '2026-10-01': 2,
      '2026-10-02': 0,
      '2026-10-03': 0,
      '2026-10-04': 0,
    })
  })

  it('leaves out a missing value on an active day when rating', () => {
    const active = new Set(days)
    expect(dailySeries(days, { '2026-10-01': 7 }, active, 'skip')).toEqual({ '2026-10-01': 7 })
  })

  it('keeps day order when collecting values', () => {
    expect(valuesInOrder(days, { '2026-10-04': 1, '2026-10-01': 2 })).toEqual([2, 1])
  })
})

describe('experiment days', () => {
  it('uses only the days the user kept to the change', () => {
    const adherence = { '2026-10-01': 1, '2026-10-02': -1, '2026-10-03': 1 }
    const series = { '2026-10-01': 6, '2026-10-02': 9, '2026-10-03': 7 }
    expect(selectExperimentDays(days.slice(0, 3), adherence, series)).toEqual([6, 7])
  })

  it('leaves out days without a check-in, and counts them as unchecked', () => {
    const adherence = { '2026-10-01': 1 }
    expect(summarizeAdherence(days, adherence)).toEqual({ kept: 1, missed: 0, unchecked: 3 })
    expect(summarizeAdherence(days, { '2026-10-01': 1, '2026-10-02': -1 })).toEqual({ kept: 1, missed: 1, unchecked: 2 })
  })

  it('reads the outcome on the following day when there is a lag', () => {
    const adherence = { '2026-10-01': 1, '2026-10-02': 1 }
    const series = { '2026-10-02': 6, '2026-10-03': 8 }
    expect(selectExperimentDays(['2026-10-01', '2026-10-02'], adherence, series, 1)).toEqual([6, 8])
  })
})

describe('outcome windows', () => {
  it('builds before and during values for one outcome', () => {
    const baselineDays = baselineDaysBefore('2026-10-03', 2)
    const experimentDays = daysFrom('2026-10-03', 2)
    const values = {
      '2026-10-01': 6,
      '2026-10-02': 5,
      '2026-10-03': 7,
      '2026-10-04': 8,
    }
    const activeDays = new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    const adherence = { '2026-10-03': 1, '2026-10-04': -1 }

    const { before, during } = outcomeWindows({
      days: experimentDays,
      baselineDays,
      values,
      activeDays,
      missingAs: 'skip',
      adherence,
    })

    expect(before).toEqual([6, 5])
    expect(during).toEqual([7])
  })

  it('shifts both windows by the lag', () => {
    const baselineDays = baselineDaysBefore('2026-10-03', 1)
    const experimentDays = daysFrom('2026-10-03', 1)
    const values = { '2026-10-01': 4, '2026-10-02': 5, '2026-10-03': 6, '2026-10-04': 9 }
    const activeDays = new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])

    const { before, during } = outcomeWindows({
      days: experimentDays,
      baselineDays,
      values,
      activeDays,
      missingAs: 'skip',
      lagDays: 1,
      adherence: { '2026-10-03': 1 },
    })

    expect(before).toEqual([6])
    expect(during).toEqual([9])
  })
})

describe('adherence tags', () => {
  it('builds a tag from the title', () => {
    expect(adherenceTagFor('No caffeine after 14:00', [])).toBe('exp_no_caffeine_after_14_00')
  })

  it('makes the tag unique', () => {
    expect(adherenceTagFor('No alcohol', ['exp_no_alcohol'])).toBe('exp_no_alcohol_2')
  })
})
