import { describe, expect, it } from 'vitest'
import { ExperimentClass } from './experiment-class'
import { buildExperimentExplainPrompt } from './experiment-explain-prompt'

const finished = () =>
  new ExperimentClass({
    id: 'e1',
    title: 'No caffeine after 14:00',
    change: 'No caffeine after 14:00',
    adherenceTag: 'exp_no_caffeine_abc123',
    outcomes: [{ tag: 'sleep_quality', direction: 'up' }],
    start: '2026-10-01',
    durationDays: 14,
    status: 'completed',
    result: {
      computedAt: '2026-10-15T10:00:00.000Z',
      adherence: { kept: 10, missed: 2, unchecked: 2 },
      outcomes: [
        {
          tag: 'sleep_quality',
          direction: 'up',
          nB: 14,
          nE: 14,
          meanB: 6.24,
          meanE: 7.4,
          sdB: 1,
          sdE: 1,
          diff: 1.16,
          pct: 18.6,
          ciLow: 0,
          ciHigh: 2,
          p: 0.01,
          d: 1,
          verdict: 'clear',
          matchesExpectation: true,
          effect: 'large',
        },
      ],
    } as any,
  })

describe('buildExperimentExplainPrompt', () => {
  it('includes the change, the adherence and the rounded numbers', () => {
    const prompt = buildExperimentExplainPrompt(finished(), { sleep_quality: 'Sleep quality' })
    expect(prompt).toContain('No caffeine after 14:00')
    expect(prompt).toContain('"kept": 10')
    expect(prompt).toContain('"tracker": "Sleep quality"')
    expect(prompt).toContain('"average": 6.2')
    expect(prompt).toContain('"average": 7.4')
    expect(prompt).toContain('"changePercent": 19')
    expect(prompt).toContain('"verdict": "clear"')
  })

  it('falls back to the tag when no label is known', () => {
    const prompt = buildExperimentExplainPrompt(finished(), {})
    expect(prompt).toContain('"tracker": "sleep quality"')
  })

  it('sends no raw log data or other fields of the experiment', () => {
    const prompt = buildExperimentExplainPrompt(finished(), {})
    expect(prompt).not.toContain('exp_no_caffeine_abc123')
    expect(prompt).not.toContain('computedAt')
    expect(prompt).not.toContain('sdB')
  })

  it('refuses an experiment that has no result yet', () => {
    const running = new ExperimentClass({ ...finished(), status: 'running', result: undefined })
    expect(() => buildExperimentExplainPrompt(running, {})).toThrow()
  })
})
