import { describe, expect, it, vi } from 'vitest'

vi.mock('../trackable/TrackableStore', () => ({ saveTrackable: vi.fn(async () => true), MasterTrackables: {} }))
vi.mock('./ExperimentStore', () => ({ ExperimentStore: { upsert: vi.fn(async () => undefined) } }))

import { buildAdherenceTracker, DID_NOT, KEPT_TO_IT } from './experiment-create'

describe('check-in tracker', () => {
  it('is a habit that records kept-to-it or not', () => {
    const tracker = buildAdherenceTracker('exp_no_caffeine_after_14_00', 'No caffeine after 14:00')
    expect(tracker.type).toBe('habit')
    expect(tracker.math).toBe('mean')
    expect(tracker.habitChoice).toEqual([KEPT_TO_IT, DID_NOT])
    expect(tracker.tag).toBe('exp_no_caffeine_after_14_00')
  })
})
