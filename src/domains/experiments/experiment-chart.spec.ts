import { describe, expect, it } from 'vitest'
import { outcomeChartConfig } from './experiment-chart'

const baseline = ['2026-10-01', '2026-10-02']
const during = ['2026-10-03', '2026-10-04', '2026-10-05']

describe('outcomeChartConfig', () => {
  it('labels every baseline and experiment day in order', () => {
    const config = outcomeChartConfig(baseline, during, {})
    expect(config.data.labels).toEqual(['1 Oct', '2 Oct', '3 Oct', '4 Oct', '5 Oct'])
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

  it('leaves days with no value as gaps, not zeros', () => {
    const config = outcomeChartConfig(baseline, during, { '2026-10-03': 0 })
    const [, duringSeries] = config.data.datasets as Array<{ data: Array<number | null> }>
    expect(duringSeries.data).toEqual([null, null, 0, null, null])
  })
})

describe('outcomeChartConfig averages', () => {
  it('adds a dashed average line over each window, and none when there is no data', () => {
    const config = outcomeChartConfig(baseline, during, {}, { before: 6.5, during: 7.2 })
    const datasets = config.data.datasets as Array<{ label: string; data: Array<number | null>; borderDash?: number[] }>
    const beforeAvg = datasets.find((d) => d.label === 'Before average')
    const duringAvg = datasets.find((d) => d.label === 'During average')
    expect(beforeAvg?.data).toEqual([6.5, 6.5, null, null, null])
    expect(duringAvg?.data).toEqual([null, null, 7.2, 7.2, 7.2])
    expect(beforeAvg?.borderDash).toEqual([6, 4])
  })

  it('leaves out an average for a window without data', () => {
    const config = outcomeChartConfig(baseline, during, {}, { before: undefined, during: 7 })
    const labels = (config.data.datasets as Array<{ label: string }>).map((d) => d.label)
    expect(labels).toEqual(['Before', 'During', 'During average'])
  })
})
