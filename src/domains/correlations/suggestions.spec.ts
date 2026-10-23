import { describe, it, expect } from 'vitest'
import { suggestLinks } from './suggestions'

const days = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const coffee = Object.fromEntries(days.map((d, i) => [d, i % 2 === 0 ? 2 : 0]))
const moodLow = Object.fromEntries(days.map((d, i) => [d, i > 0 && i % 2 === 1 ? 3 : 8]))
// a sequence with no clear link to coffee, at either lag
const flat = Object.fromEntries(days.map((d, i) => [d, [6, 1, 9, 4, 7, 2, 8, 3, 5, 6, 1, 9, 4, 7][i]]))

const long28 = Array.from({ length: 28 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const coffee28 = () => Object.fromEntries(long28.map((d, i) => [d, i % 2 === 0 ? 2 : 0]))
const mood28 = () => Object.fromEntries(long28.map((d, i) => [d, i > 0 && i % 2 === 1 ? 3 : 8]))

describe('suggestLinks', () => {
  it('finds the link between a tracker and a person, and names both', () => {
    const long = Array.from({ length: 28 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
    const coffee28 = Object.fromEntries(long.map((d, i) => [d, i % 2 === 0 ? 2 : 0]))
    const mood28 = Object.fromEntries(long.map((d, i) => [d, i > 0 && i % 2 === 1 ? 3 : 8]))
    const flat28 = Object.fromEntries(long.map((d, i) => [d, [6, 1, 9, 4, 7, 2, 8, 3, 5, 6, 1, 9, 4, 7][i % 14]]))
    const items = [
      { key: '#coffee', label: 'Coffee', type: 'tracker', series: coffee28 },
      { key: '@em', label: 'Em', type: 'person', series: mood28 },
      { key: '+work', label: 'Work', type: 'context', series: flat28 },
    ]
    const found = suggestLinks(items)
    expect(found.length).toBeGreaterThan(0)
    const nextDay = found.find((s) => s.a.key === '#coffee' && s.b.key === '@em' && s.link.lag === 1)
    expect(nextDay?.link.direction).toBe('lower')
    expect(found.every((s) => s.a.key !== '+work' && s.b.key !== '+work')).toBe(true)
  })

  it('returns nothing when no pair is linked', () => {
    const items = [
      { key: '#a', label: 'A', type: 'tracker', series: flat },
      { key: '#b', label: 'B', type: 'tracker', series: Object.fromEntries(days.map((d, i) => [d, [4, 8, 1, 6, 3, 9, 2, 7, 5, 8, 4, 1, 6, 3][i]])) },
    ]
    expect(suggestLinks(items)).toEqual([])
  })

  it('needs two weeks of days, so a week of chance agreement is not suggested', () => {
    const week = Object.fromEntries(days.slice(0, 7).map((d, i) => [d, i % 2 === 0 ? 2 : 0]))
    const weekMood = Object.fromEntries(days.slice(0, 7).map((d, i) => [d, i > 0 && i % 2 === 1 ? 3 : 8]))
    const items = [
      { key: '#c', label: 'C', type: 'tracker', series: week },
      { key: '#m', label: 'M', type: 'tracker', series: weekMood },
    ]
    expect(suggestLinks(items)).toEqual([])
  })

  it('keeps the list to the limit', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ key: `#t${i}`, label: `T${i}`, type: 'tracker', series: i % 2 ? coffee : moodLow }))
    expect(suggestLinks(many, 3).length).toBeLessThanOrEqual(3)
  })

  it('shows a same-day link once, not once from each side', () => {
    const items = [
      { key: '#coffee', label: 'Coffee', type: 'tracker', series: coffee28() },
      { key: '#mood', label: 'Mood', type: 'tracker', series: mood28() },
    ]
    const sameDay = suggestLinks(items).filter((s) => s.link.lag === 0)
    expect(sameDay).toHaveLength(1)
  })
})
