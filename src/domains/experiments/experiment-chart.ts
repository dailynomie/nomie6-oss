import dayjs from 'dayjs'
import type { ChartConfiguration, ChartDataset } from 'chart.js'
import type { DailyValues } from './experiment-data'

const BEFORE_COLOR = '#9ca3af' // grey, the baseline (guide 5.6)
const DURING_COLOR = '#00aaff' // tint, the experiment (guide 5.6)

/**
 * One bar per day for an outcome: the baseline days in grey and the experiment days in tint (guide 5.6).
 * Each day is stacked into one of the two series, so a day with no value is an empty space, never a zero.
 * The bars are rounded, with a small gap between them. The Before and During captions sit above the chart.
 */
export const outcomeChartConfig = (
  baselineDays: Array<string>,
  experimentDays: Array<string>,
  values: DailyValues
): ChartConfiguration<'bar'> => {
  const labels = [...baselineDays, ...experimentDays].map((day) => dayjs(day).format('D MMM'))
  const beforeData = [...baselineDays.map((day) => values[day] ?? null), ...experimentDays.map(() => null)]
  const duringData = [...baselineDays.map(() => null), ...experimentDays.map((day) => values[day] ?? null)]

  const datasets: Array<ChartDataset<'bar'>> = [
    {
      label: 'Before',
      data: beforeData,
      backgroundColor: BEFORE_COLOR,
      borderRadius: 3,
      barPercentage: 0.85,
      categoryPercentage: 0.85,
    },
    {
      label: 'During',
      data: duringData,
      backgroundColor: DURING_COLOR,
      borderRadius: 3,
      barPercentage: 0.85,
      categoryPercentage: 0.85,
    },
  ]

  return {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { stacked: true, display: false },
        y: { stacked: true, display: false, beginAtZero: true },
      },
    },
  }
}
