import { describe, expect, it } from 'vitest'
import { outcomeChartConfig } from './experiment-chart'

const baseline = ['2026-10-01', '2026-10-02']
const during = ['2026-10-03', '2026-10-04', '2026-10-05']

describe('outcomeChartConfig', () => {
  it('is a stacked bar chart with one bar per day, baseline first', () => {
    const config = outcomeChartConfig(baseline, during, {})
    expect(config.type).toBe('bar')
    // the day labels use the app's locale date without the year (English here: 10/01)
    expect(config.data.labels).toEqual(['10/01', '10/02', '10/03', '10/04', '10/05'])
    expect(config.options.scales.x.stacked).toBe(true)
    expect(config.options.scales.y.stacked).toBe(true)
  })

  it('puts the baseline values in the Before series only, and the experiment values in During only', () => {
    const config = outcomeChartConfig(baseline, during, {
      '2026-10-01': 6,
      '2026-10-03': 7,
      '2026-10-04': 8,
    })
    const [before, duringSeries] = config.data.datasets as Array<{ label: string; data: Array<number | null> }>
    expect(before.label).toBe('Before')
    expect(before.data).toEqual([6, null, null, null, null])
    expect(duringSeries.label).toBe('During')
    expect(duringSeries.data).toEqual([null, null, 7, 8, null])
  })

  it('leaves days with no value as empty space, not zero bars', () => {
    const config = outcomeChartConfig(baseline, during, { '2026-10-03': 0 })
    const [, duringSeries] = config.data.datasets as Array<{ data: Array<number | null> }>
    expect(duringSeries.data).toEqual([null, null, 0, null, null])
  })

  it('has no average lines: the Before and During boxes carry the averages', () => {
    const config = outcomeChartConfig(baseline, during, {})
    const labels = (config.data.datasets as Array<{ label: string }>).map((d) => d.label)
    expect(labels).toEqual(['Before', 'During'])
  })
})
