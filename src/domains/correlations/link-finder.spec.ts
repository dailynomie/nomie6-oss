import { describe, it, expect } from 'vitest'
import { findLink, findLinks, median, MIN_LINK_DAYS } from './link-finder'

// Fourteen days. Coffee (A) is high on the even days. Mood (B) is low on the day after each high coffee day.
const days = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const coffee = Object.fromEntries(days.map((d, i) => [d, i % 2 === 0 ? 2 : 0]))
const mood = Object.fromEntries(days.map((d, i) => [d, i > 0 && i % 2 === 1 ? 3 : 8]))

// Mood with no relation to coffee: about half the high coffee days are followed by a lower value, at both lags.
const unrelatedOrder = [6, 1, 9, 4, 7, 2, 8, 3, 5, 6, 1, 9, 4, 7]
const unrelated = Object.fromEntries(days.map((d, i) => [d, unrelatedOrder[i]]))

describe('median', () => {
  it('takes the middle value, or the mean of the two middle values', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('findLink', () => {
  it('finds mood lower the day after high coffee', () => {
    const next = findLink(coffee, mood, 1)
    expect(next).toBeDefined()
    expect(next!.direction).toBe('lower')
    expect(next!.lag).toBe(1)
    expect(next!.matches).toBe(next!.total)
  })

  it('counts only the high days that have a value for the other tracker', () => {
    // 24 days: coffee is high on the even days before day 20; mood is 1 the day after a high day, and 9 otherwise
    const long = Array.from({ length: 24 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)
    const coffeeLong = Object.fromEntries(long.map((d, i) => [d, i % 2 === 0 && i < 20 ? 2 : 0]))
    const moodLong: { [day: string]: number | undefined } = Object.fromEntries(
      long.map((d, i) => [d, i % 2 === 1 && i < 20 ? 1 : 9])
    )
    moodLong[long[3]] = undefined // the day after the second high coffee day has no mood value
    const link = findLink(coffeeLong, moodLong, 1)
    expect(link!.direction).toBe('lower')
    expect(link!.total).toBe(9)
    expect(link!.matches).toBe(9)
  })

  it('needs at least seven high days with a value', () => {
    const sparse = { ...mood }
    delete sparse[days[2]] // six high coffee days are left with a value
    expect(findLink(coffee, sparse, 1)).toBeUndefined()
  })

  it('shows nothing when there are too few days', () => {
    const short = Object.fromEntries(days.slice(0, MIN_LINK_DAYS - 1).map((d) => [d, 1]))
    expect(findLink(short, short, 0)).toBeUndefined()
  })

  it('shows nothing when the direction is split', () => {
    // mood goes down after high coffee on half the days and up on the other half
    const split = Object.fromEntries(days.map((d, i) => [d, i % 4 === 1 ? 3 : 8]))
    expect(findLink(coffee, split, 1)).toBeUndefined()
  })

  it('shows nothing when the two trackers have no relation', () => {
    expect(findLink(coffee, unrelated, 0)).toBeUndefined()
    expect(findLink(coffee, unrelated, 1)).toBeUndefined()
  })

  it('reports higher when B goes up after high A', () => {
    const up = Object.fromEntries(days.map((d, i) => [d, i > 0 && i % 2 === 1 ? 9 : 2]))
    expect(findLink(coffee, up, 1)!.direction).toBe('higher')
  })
})

describe('findLinks', () => {
  it('includes the next-day link', () => {
    expect(findLinks(coffee, mood).map((l) => l.lag)).toContain(1)
  })

  it('returns nothing for unrelated trackers', () => {
    expect(findLinks(coffee, unrelated)).toEqual([])
  })
})
