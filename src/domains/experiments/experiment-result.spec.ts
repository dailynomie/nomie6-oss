import { describe, expect, it } from 'vitest'
import { computeResult, experimentDaysSoFar, summaryNote, verdictText } from './experiment-result'
import { daysFrom, baselineDaysBefore } from './experiment-data'

const experimentBase = {
  id: 'e1',
  title: 'No coffee after 14:00',
  change: 'No coffee after 14:00',
  adherenceTag: 'exp_no_coffee',
  status: 'running' as const,
  start: '2026-10-15',
  durationDays: 14,
  outcomes: [{ tag: 'sleep_quality', direction: 'up' as const, lagDays: 0 as const }],
}

describe('experiment days so far', () => {
  it('leaves out days after today', () => {
    expect(experimentDaysSoFar('2026-10-15', 4, '2026-10-17')).toEqual(['2026-10-15', '2026-10-16', '2026-10-17'])
  })
})

describe('live result', () => {
  it('shows not enough data early on', () => {
    const baseline = baselineDaysBefore('2026-10-15', 14)
    const values = { sleep_quality: Object.fromEntries(baseline.map((d) => [d, 6])) }
    const active = new Set([...baseline, '2026-10-15'])
    const result = computeResult({
      experiment: experimentBase,
      today: '2026-10-15',
      activeDays: active,
      outcomeValues: { sleep_quality: { ...values.sleep_quality, '2026-10-15': 8 } },
      missingAs: { sleep_quality: 'skip' },
      adherence: { '2026-10-15': 1 },
    })
    expect(result.adherence).toEqual({ kept: 1, missed: 0, unchecked: 0 })
    expect(result.outcomes[0].verdict).toBe('not-enough-data')
    expect(verdictText(result.outcomes[0])).toBe('Not enough data yet: 1 of 7 days needed.')
  })

  it('finds a clear change after a full experiment (reference example A)', () => {
    const b = [6, 7, 6, 5, 7, 6, 7, 6, 6, 7, 5, 6, 7, 6]
    const e = [7, 8, 7, 7, 8, 6, 8, 7, 8, 7, 7, 8, 7, 8]
    const baseline = baselineDaysBefore('2026-10-15', 14)
    const experimentDays = daysFrom('2026-10-15', 14)
    const sleep: { [day: string]: number } = {}
    baseline.forEach((d, i) => (sleep[d] = b[i]))
    experimentDays.forEach((d, i) => (sleep[d] = e[i]))
    const adherence: { [day: string]: number } = {}
    experimentDays.forEach((d) => (adherence[d] = 1))

    const result = computeResult({
      experiment: experimentBase,
      today: '2026-10-28',
      activeDays: new Set([...baseline, ...experimentDays]),
      outcomeValues: { sleep_quality: sleep },
      missingAs: { sleep_quality: 'skip' },
      adherence,
    })

    const outcome = result.outcomes[0]
    expect(outcome.verdict).toBe('clear')
    expect(outcome.matchesExpectation).toBe(true)
    expect(verdictText(outcome)).toBe('A clear change, as you hoped.')
    expect(Math.abs(outcome.diff - 1.142857)).toBeLessThan(1e-6)
    expect(result.adherence).toEqual({ kept: 14, missed: 0, unchecked: 0 })
  })

  it('states the other verdicts in plain words', () => {
    const base = {
      tag: 'x',
      direction: 'up' as const,
      nB: 14,
      nE: 14,
      meanB: 0,
      meanE: 0,
      sdB: 0,
      sdE: 0,
      diff: 0,
      ciLow: 0,
      ciHigh: 0,
      p: 1,
      d: 0,
      effect: 'negligible' as const,
    }
    expect(verdictText({ ...base, verdict: 'hint' })).toBe('Possibly a difference. Keep going to be sure.')
    expect(verdictText({ ...base, verdict: 'no-clear-difference' })).toBe('No clear difference.')
    expect(verdictText({ ...base, verdict: 'clear', matchesExpectation: false })).toBe(
      'A clear change, the opposite of what you hoped.'
    )
  })
})

describe('journal note', () => {
  it('summarises the result in plain text', () => {
    const note = summaryNote('No coffee after 14:00', {
      computedAt: '2026-10-29T10:00:00.000Z',
      adherence: { kept: 14, missed: 0, unchecked: 0 },
      outcomes: [
        {
          tag: 'sleep_quality',
          direction: 'up',
          nB: 14,
          nE: 14,
          meanB: 6.2,
          meanE: 7.4,
          sdB: 0,
          sdE: 0,
          diff: 1.2,
          pct: 18.4,
          ciLow: 0,
          ciHigh: 0,
          p: 0.001,
          d: 1,
          verdict: 'clear',
          matchesExpectation: true,
          effect: 'large',
        },
      ],
    })
    expect(note).toBe('Finished experiment "No coffee after 14:00": sleep_quality 6.2 → 7.4 (+18%, clear) +experiment')
    expect(note).not.toContain('#')
  })
})
