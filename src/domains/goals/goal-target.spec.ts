import { describe, expect, test } from 'vitest'
import { goalTargetText } from './goal-utils'

describe('goal target line', () => {
  test('at least a daily target', () => {
    expect(goalTargetText({ comparison: 'gte', duration: 'day' } as any, '5 km')).toBe('At least 5 km a day')
  })
  test('at most a weekly target', () => {
    expect(goalTargetText({ comparison: 'lte', duration: 'week' } as any, '2 cups')).toBe('At most 2 cups a week')
  })
  test('no line without a comparison or duration', () => {
    expect(goalTargetText({ comparison: undefined, duration: 'day' } as any, '5')).toBe('')
  })
})
