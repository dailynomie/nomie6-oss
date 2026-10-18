import { describe, expect, it } from 'vitest'
import { compareWindows, effectLabel, tCdf, tInv } from './experiment-stats'

const close = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe('t distribution', () => {
  it('matches the reference values', () => {
    close(tCdf(2.0, 5), 0.9490302606, 1e-7)
    close(tCdf(1.0, 10.5), 0.8301008037, 1e-7)
    close(tCdf(-2.5, 13.7), 0.0128923282, 1e-7)
    close(tCdf(4.0, 25), 0.9997522782, 1e-7)
  })

  it('inverts the cumulative distribution', () => {
    close(tInv(0.975, 5), 2.57058184, 1e-6)
    close(tInv(0.975, 30), 2.04227246, 1e-6)
    close(tInv(0.975, 25.74883), 2.05650575, 1e-6)
  })
})

describe('comparing two windows', () => {
  const b = [6, 7, 6, 5, 7, 6, 7, 6, 6, 7, 5, 6, 7, 6]
  const e = [7, 8, 7, 7, 8, 6, 8, 7, 8, 7, 7, 8, 7, 8]

  it('finds a clear effect (example A)', () => {
    const r = compareWindows('sleep_quality', 'up', b, e)
    close(r.meanB, 6.214286, 1e-6)
    close(r.meanE, 7.357143, 1e-6)
    close(r.sdB, 0.699293, 1e-6)
    close(r.sdE, 0.633324, 1e-6)
    close(r.diff, 1.142857, 1e-6)
    close(r.pct as number, 18.3908, 1e-4)
    close(r.p, 0.0001178, 1e-7)
    close(r.ciLow, 0.624311, 1e-6)
    close(r.ciHigh, 1.661404, 1e-6)
    close(r.d, 1.71311, 1e-5)
    expect(r.verdict).toBe('clear')
    expect(r.effect).toBe('large')
    expect(r.matchesExpectation).toBe(true)
  })

  it('finds no difference (example B)', () => {
    const r = compareWindows(
      'mood',
      'either',
      [5, 6, 7, 6, 5, 7, 6, 6, 5, 7],
      [6, 5, 7, 6, 6, 5, 7, 6, 6, 6]
    )
    close(r.diff, 0, 1e-12)
    close(r.p, 1, 1e-9)
    close(r.ciLow, -0.702321, 1e-6)
    close(r.ciHigh, 0.702321, 1e-6)
    close(r.d, 0, 1e-12)
    expect(r.verdict).toBe('no-clear-difference')
    expect(r.matchesExpectation).toBeUndefined()
  })

  it('reports not enough data below seven days in either window (example C)', () => {
    const r = compareWindows('sleep_quality', 'up', [6, 7, 6, 5, 7], e)
    expect(r.verdict).toBe('not-enough-data')
  })

  it('never returns NaN when a window has no variation', () => {
    const same = compareWindows('steps', 'up', [5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5])
    expect(same.p).toBe(1)
    expect(same.d).toBe(0)
    expect(Number.isNaN(same.d) || Number.isNaN(same.p)).toBe(false)

    const changed = compareWindows('steps', 'up', [5, 5, 5, 5, 5, 5, 5], [6, 6, 6, 6, 6, 6, 6])
    expect(changed.p).toBe(0)
    expect(changed.d).toBe(Infinity)
    expect(changed.verdict).toBe('clear')
  })

  it('does not divide by zero when the baseline mean is zero', () => {
    const r = compareWindows('headache', 'down', [0, 0, 0, 0, 0, 0, 0], [1, 0, 1, 0, 1, 0, 1])
    expect(r.pct).toBeUndefined()
  })

  it('labels the size of the effect', () => {
    expect(effectLabel(0.1)).toBe('negligible')
    expect(effectLabel(-0.3)).toBe('small')
    expect(effectLabel(0.6)).toBe('medium')
    expect(effectLabel(-0.9)).toBe('large')
  })
})
