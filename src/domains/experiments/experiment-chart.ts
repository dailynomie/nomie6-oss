import dayjs from 'dayjs'
import type { ChartConfiguration, ChartDataset } from 'chart.js'
import type { DailyValues } from './experiment-data'

const BEFORE_COLOR = '#9ca3af' // grey, the baseline
const DURING_COLOR = '#00aaff' // primary, the experiment
const TEXT_COLOR = '#9ca3af' // readable on both light and dark backgrounds
const GRID_COLOR = 'rgba(156, 163, 175, 0.2)'

/** The averages from the stats, so the lines match the numbers on the cards. Omit a window with no data. */
export type OutcomeAverages = { before?: number; during?: number }

/**
 * A line chart of one outcome: the baseline days in grey and the experiment days in blue.
 * A day with no value is a gap, never a zero. Dashed lines show the two averages.
 */
export const outcomeChartConfig = (
  baselineDays: Array<string>,
  experimentDays: Array<string>,
  values: DailyValues,
  averages: OutcomeAverages = {}
): ChartConfiguration<'line'> => {
  const labels = [...baselineDays, ...experimentDays].map((day) => dayjs(day).format('D MMM'))
  const beforeData = [...baselineDays.map((day) => values[day] ?? null), ...experimentDays.map(() => null)]
  const duringData = [...baselineDays.map(() => null), ...experimentDays.map((day) => values[day] ?? null)]

  const datasets: Array<ChartDataset<'line'>> = [
    { label: 'Before', data: beforeData, borderColor: BEFORE_COLOR, backgroundColor: BEFORE_COLOR, pointRadius: 2, tension: 0.3 },
    { label: 'During', data: duringData, borderColor: DURING_COLOR, backgroundColor: DURING_COLOR, pointRadius: 2, tension: 0.3 },
  ]

  if (averages.before !== undefined) {
    datasets.push({
      label: 'Before average',
      data: [...baselineDays.map(() => averages.before ?? null), ...experimentDays.map(() => null)],
      borderColor: BEFORE_COLOR,
      borderDash: [6, 4],
      borderWidth: 1.5,
      pointRadius: 0,
    })
  }
  if (averages.during !== undefined) {
    datasets.push({
      label: 'During average',
      data: [...baselineDays.map(() => null), ...experimentDays.map(() => averages.during ?? null)],
      borderColor: DURING_COLOR,
      borderDash: [6, 4],
      borderWidth: 1.5,
      pointRadius: 0,
    })
  }

  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { labels: { color: TEXT_COLOR, boxWidth: 10 } },
      },
      scales: {
        x: { ticks: { color: TEXT_COLOR, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
        y: { ticks: { color: TEXT_COLOR }, grid: { color: GRID_COLOR } },
      },
    },
  }
}
