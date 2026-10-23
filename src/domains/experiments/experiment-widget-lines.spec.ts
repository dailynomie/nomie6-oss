import { describe, expect, it } from 'vitest'
import { ExperimentClass } from './experiment-class'
import { experimentWidgetView } from './experiment-widget-lines'

const experiment = (overrides = {}) =>
  new ExperimentClass({
    id: 'e1',
    title: 'No caffeine after 14:00',
    change: '',
    adherenceTag: 'exp_no_caffeine_abc123',
    outcomes: [{ tag: 'sleep_quality', direction: 'up' }],
    start: '2026-10-01',
    durationDays: 14,
    status: 'running',
    ...overrides,
  })

const outcome = (overrides = {}) => ({
  tag: 'sleep_quality',
  direction: 'up',
  nB: 7,
  nE: 7,
  meanB: 6,
  meanE: 7,
  sdB: 1,
  sdE: 1,
  diff: 1,
  pct: 16,
  ciLow: 0,
  ciHigh: 2,
  p: 0.01,
  d: 1,
  verdict: 'clear',
  matchesExpectation: true,
  effect: 'large',
  ...overrides,
})

const snapshot = (outcomes = [outcome()]) =>
  ({
    computedAt: '2026-10-18T10:00:00.000Z',
    adherence: { kept: 5, missed: 1, unchecked: 2 },
    outcomes,
  }) as any

describe('experimentWidgetView', () => {
  it('shows the day count and progress while running', () => {
    const view = experimentWidgetView(experiment(), undefined, 7)
    expect(view.title).toBe('No caffeine after 14:00')
    expect(view.status).toBe('Day 7 of 14')
    expect(view.progress).toBe(0.5)
    expect(view.adherence).toBeUndefined()
    expect(view.outcomes).toEqual([])
  })

  it('caps the day count and progress at the duration', () => {
    const view = experimentWidgetView(experiment(), undefined, 30)
    expect(view.status).toBe('Day 14 of 14')
    expect(view.progress).toBe(1)
  })

  it('shows adherence and a positive tone for a clear change as hoped', () => {
    const view = experimentWidgetView(experiment(), snapshot(), 9)
    expect(view.adherence).toEqual({ kept: 5, total: 8 })
    expect(view.outcomes).toEqual([{ label: 'sleep quality', text: 'A clear change, as you hoped.', tone: 'positive' }])
  })

  it('uses a possible tone for a hint and neutral otherwise', () => {
    const view = experimentWidgetView(
      experiment(),
      snapshot([
        outcome({ verdict: 'hint', matchesExpectation: true }),
        outcome({ tag: 'mood', verdict: 'no-clear-difference', matchesExpectation: undefined }),
      ]),
      9
    )
    expect(view.outcomes[0].tone).toBe('possible')
    expect(view.outcomes[1].tone).toBe('neutral')
  })

  it('names a finished experiment and a stopped one, full progress when finished', () => {
    const finished = experimentWidgetView(experiment({ status: 'completed' }), snapshot(), 14)
    expect(finished.status).toBe('Finished')
    expect(finished.progress).toBe(1)
    expect(experimentWidgetView(experiment({ status: 'stopped' }), snapshot(), 5).status).toBe('Stopped early')
  })
})
