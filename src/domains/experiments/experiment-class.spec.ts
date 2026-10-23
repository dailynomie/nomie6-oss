import { describe, expect, it } from 'vitest'

import { ExperimentClass, serializeExperiment } from './experiment-class'

const plain = {
  id: 'e1',
  title: 'No alcohol',
  change: 'No alcohol',
  adherenceTag: 'exp_no_alcohol_abc123',
  status: 'running' as const,
  start: '2026-10-01',
  durationDays: 14,
  outcomes: [{ tag: 'mood', direction: 'up' as const }],
}

describe('saving experiments', () => {
  it('saves a plain experiment as its data', () => {
    expect(serializeExperiment(plain)).toEqual(plain)
  })

  it('saves a class instance as its data', () => {
    expect(serializeExperiment(new ExperimentClass(plain))).toEqual(plain)
  })
})
