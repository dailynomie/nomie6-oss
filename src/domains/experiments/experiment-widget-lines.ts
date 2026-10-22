import type { ExperimentResultSnapshot, ExperimentType } from './experiment-class'
import { verdictText } from './experiment-result'
import { Lang } from '../../store/lang'

export type OutcomeTone = 'positive' | 'possible' | 'neutral'

export type ExperimentWidgetOutcome = {
  label: string
  text: string
  tone: OutcomeTone
}

export type ExperimentWidgetView = {
  title: string
  status: string
  progress: number // 0 to 1, share of the experiment days that have happened
  adherence?: { kept: number; total: number }
  outcomes: Array<ExperimentWidgetOutcome>
}

/** positive: a clear change as hoped. possible: a hint. neutral: anything else. */
export const outcomeTone = (verdict: string, matchesExpectation?: boolean): OutcomeTone => {
  if (verdict === 'clear' && matchesExpectation === true) return 'positive'
  if (verdict === 'hint') return 'possible'
  return 'neutral'
}

/** The content a dashboard widget shows for an experiment. */
export const experimentWidgetView = (
  experiment: ExperimentType,
  snapshot: ExperimentResultSnapshot | undefined,
  daysSoFar: number
): ExperimentWidgetView => {
  const running = experiment.status === 'running'
  const status = running
    ? `Day ${Math.min(daysSoFar, experiment.durationDays)} of ${experiment.durationDays}`
    : experiment.status === 'stopped'
      ? Lang.t('experiments.stopped-early', 'Stopped early')
      : Lang.t('experiments.finished', 'Finished')
  const progress = running ? Math.min(1, daysSoFar / experiment.durationDays) : 1

  const view: ExperimentWidgetView = { title: experiment.title, status, progress, outcomes: [] }
  if (snapshot) {
    const { kept, missed, unchecked } = snapshot.adherence
    view.adherence = { kept, total: kept + missed + unchecked }
    view.outcomes = snapshot.outcomes.map((outcome) => ({
      label: outcome.tag.replace(/_/g, ' '),
      text: verdictText(outcome),
      tone: outcomeTone(outcome.verdict, outcome.matchesExpectation),
    }))
  }
  return view
}
