import type { ExperimentResultSnapshot, ExperimentType } from './experiment-class'
import { baselineDaysBefore, daysFrom, outcomeWindows, summarizeAdherence, type Adherence, type DailyValues } from './experiment-data'
import { compareWindows, type OutcomeResult } from './experiment-stats'

export const CAVEAT =
  'This compares your own days before and during the experiment. Other things in your life change too, and one day affects the next, so treat this as a strong hint, not proof.'

export type ResultInput = {
  experiment: ExperimentType
  today: string // YYYY-MM-DD
  activeDays: Set<string> // days with at least one log, covering the baseline and the experiment
  outcomeValues: { [tag: string]: DailyValues }
  missingAs: { [tag: string]: 'zero' | 'skip' }
  adherence: Adherence // the check-in tracker: 1 kept to it, -1 did not
}

/** The experiment days that have already happened (up to and including today). */
export const experimentDaysSoFar = (start: string, durationDays: number, today: string): Array<string> =>
  daysFrom(start, durationDays).filter((day) => day <= today)

/** The live result for every outcome, computed from the data collected so far. */
export const computeResult = (input: ResultInput): ExperimentResultSnapshot => {
  const { experiment } = input
  const days = experimentDaysSoFar(experiment.start, experiment.durationDays, input.today)
  const baselineDays = baselineDaysBefore(experiment.start, experiment.baselineDays ?? experiment.durationDays)

  const outcomes: Array<OutcomeResult> = experiment.outcomes.map((outcome) => {
    const { before, during } = outcomeWindows({
      days,
      baselineDays,
      values: input.outcomeValues[outcome.tag] || {},
      activeDays: input.activeDays,
      missingAs: outcome.missingAs ?? input.missingAs[outcome.tag] ?? 'zero',
      lagDays: outcome.lagDays ?? 0,
      adherence: input.adherence,
    })
    return compareWindows(outcome.tag, outcome.direction, before, during)
  })

  return {
    computedAt: new Date().toJSON(),
    adherence: summarizeAdherence(days, input.adherence),
    outcomes,
  }
}

/** One plain-language line for an outcome, in the order the verdicts are decided. */
export const verdictText = (result: OutcomeResult): string => {
  switch (result.verdict) {
    case 'not-enough-data': {
      const fewest = Math.min(result.nB, result.nE)
      return `Not enough data yet: ${fewest} of 7 days needed.`
    }
    case 'clear':
      if (result.matchesExpectation === true) return 'A clear change, as you hoped.'
      if (result.matchesExpectation === false) return 'A clear change, the opposite of what you hoped.'
      return 'A clear change.'
    case 'hint':
      return 'Possibly a difference. Keep going to be sure.'
    case 'no-clear-difference':
      return 'No clear difference.'
  }
}

const shortVerdict = (result: OutcomeResult): string => {
  switch (result.verdict) {
    case 'not-enough-data':
      return 'not enough data'
    case 'clear':
      return 'clear'
    case 'hint':
      return 'possible'
    case 'no-clear-difference':
      return 'no clear difference'
  }
}

/** The journal note written when an experiment ends. Tracker names are plain text, not #tags. */
export const summaryNote = (title: string, snapshot: ExperimentResultSnapshot): string => {
  const parts = snapshot.outcomes.map((o) => {
    const pct = o.pct === undefined ? '' : `${o.pct > 0 ? '+' : ''}${o.pct.toFixed(0)}%, `
    return `${o.tag} ${o.meanB.toFixed(1)} → ${o.meanE.toFixed(1)} (${pct}${shortVerdict(o)})`
  })
  return `Finished experiment "${title}": ${parts.join('; ')} +experiment`
}
