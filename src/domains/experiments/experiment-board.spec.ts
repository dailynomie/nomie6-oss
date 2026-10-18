import { describe, expect, it } from 'vitest'
import { experimentBoardElements } from './experiment-board'

describe('experimentBoardElements', () => {
  it('lists the check-in tracker of every experiment with a leading #', () => {
    expect(
      experimentBoardElements([{ adherenceTag: 'exp_no_caffeine_abc123' }, { adherenceTag: 'exp_walk_def456' }])
    ).toEqual(['#exp_no_caffeine_abc123', '#exp_walk_def456'])
  })

  it('is empty when there are no experiments', () => {
    expect(experimentBoardElements([])).toEqual([])
  })

  it('skips an experiment without a check-in tracker', () => {
    expect(experimentBoardElements([{ adherenceTag: '' }])).toEqual([])
  })
})
