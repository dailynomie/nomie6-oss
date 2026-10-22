import type { ExpectedDirection } from './experiment-class'
import { Lang } from '../../store/lang'

export type ExperimentPresetOutcome = { tag: string; direction: ExpectedDirection }

export type ExperimentPreset = {
  id: string
  title: string
  change: string
  outcomes: Array<ExperimentPresetOutcome>
  lagDays: 0 | 1
  durationDays: number
}

// Outcome tags are suggestions: the editor matches them to the user's own trackers
export const EXPERIMENT_PRESETS: Array<ExperimentPreset> = [
  {
    id: 'no-caffeine-after-14',
    title: Lang.t('experiments.no-caffeine-after-14-00', 'No caffeine after 14:00'),
    change: 'No caffeine after 14:00',
    outcomes: [{ tag: 'sleep_quality', direction: 'up' }],
    lagDays: 1,
    durationDays: 14,
  },
  {
    id: 'daily-walk',
    title: '30-minute walk each day',
    change: 'A 30-minute walk every day',
    outcomes: [
      { tag: 'mood', direction: 'up' },
      { tag: 'energy', direction: 'up' },
    ],
    lagDays: 0,
    durationDays: 14,
  },
  {
    id: 'no-screens-before-bed',
    title: Lang.t('experiments.no-screens-in-the-last-hour-before-bed', 'No screens in the last hour before bed'),
    change: 'No screens in the last hour before bed',
    outcomes: [{ tag: 'sleep_quality', direction: 'up' }],
    lagDays: 1,
    durationDays: 14,
  },
  {
    id: 'no-alcohol',
    title: Lang.t('experiments.no-alcohol', 'No alcohol'),
    change: 'No alcohol',
    outcomes: [
      { tag: 'sleep_quality', direction: 'up' },
      { tag: 'mood', direction: 'up' },
    ],
    lagDays: 1,
    durationDays: 14,
  },
  {
    id: 'ten-minute-meditation',
    title: '10-minute meditation',
    change: '10 minutes of meditation each day',
    outcomes: [
      { tag: 'stress', direction: 'down' },
      { tag: 'mood', direction: 'up' },
    ],
    lagDays: 0,
    durationDays: 14,
  },
]
