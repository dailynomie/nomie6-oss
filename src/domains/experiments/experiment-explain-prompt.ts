import type { ExperimentType } from './experiment-class'

const round1 = (value: number): number => Math.round(value * 10) / 10

/**
 * The data the AI explanation may see: the change, the tracker names and the frozen result.
 * No raw logs, no notes, no summary of the user's life. The numbers are already calculated.
 */
export const buildExperimentExplainPrompt = (
  experiment: ExperimentType,
  trackerLabels: Record<string, string>
): string => {
  const result = experiment.result
  if (!result) throw new Error('This experiment has no result to explain yet')

  const data = {
    change: experiment.change,
    durationDays: experiment.durationDays,
    status: experiment.status,
    adherence: result.adherence,
    outcomes: result.outcomes.map((outcome) => ({
      tracker: trackerLabels[outcome.tag] ?? outcome.tag.replace(/_/g, ' '),
      hopedFor: outcome.direction,
      before: { days: outcome.nB, average: round1(outcome.meanB) },
      during: { days: outcome.nE, average: round1(outcome.meanE) },
      changePercent: outcome.pct === undefined ? null : Math.round(outcome.pct),
      verdict: outcome.verdict,
      matchesHope: outcome.matchesExpectation ?? null,
    })),
  }

  return `Experiment result:\n${JSON.stringify(data, null, 2)}`
}
