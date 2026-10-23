import type { OutcomeResult } from './experiment-stats'

export type ExperimentStatus = 'running' | 'completed' | 'stopped'
export type ExpectedDirection = 'up' | 'down' | 'either'
export type MissingDayRule = 'zero' | 'skip'

export type ExperimentOutcome = {
  tag: string // tracker tag without '#', e.g. 'sleep_quality'
  direction: ExpectedDirection
  missingAs?: MissingDayRule // default from tracker: math 'mean' → 'skip', otherwise 'zero'
  lagDays?: 0 | 1 // 1 = the effect shows the next day
}

export type ExperimentResultSnapshot = {
  computedAt: string
  adherence: { kept: number; missed: number; unchecked: number }
  outcomes: Array<OutcomeResult>
}

export type ExperimentType = {
  id?: string
  title: string // "No coffee after 14:00"
  change: string // what the user does differently
  adherenceTag: string // habit tracker created for check-ins, e.g. 'exp_no_late_coffee'
  outcomes: Array<ExperimentOutcome>
  start: string // 'YYYY-MM-DD', first day of the experiment
  durationDays: number // 7 | 14 | 21 | 28
  baselineDays?: number // default = durationDays
  status: ExperimentStatus
  presetId?: string
  result?: ExperimentResultSnapshot // frozen when completed or stopped
  explanation?: string // AI explanation of the frozen result, saved so it is not asked again
  created?: string
  updated?: string
}

export const EXPERIMENT_DURATIONS = [7, 14, 21, 28]

export class ExperimentClass implements ExperimentType {
  id?: string
  title: string
  change: string
  adherenceTag: string
  outcomes: Array<ExperimentOutcome>
  start: string
  durationDays: number
  baselineDays?: number
  status: ExperimentStatus
  presetId?: string
  result?: ExperimentResultSnapshot
  explanation?: string
  created?: string
  updated?: string

  constructor(starter: Partial<ExperimentType> = {}) {
    this.id = starter.id
    this.title = starter.title || ''
    this.change = starter.change || ''
    this.adherenceTag = starter.adherenceTag || ''
    this.outcomes = (starter.outcomes || []).map((o) => ({ ...o }))
    this.start = starter.start || ''
    this.durationDays = starter.durationDays || 14
    this.baselineDays = starter.baselineDays
    this.status = starter.status || 'running'
    this.presetId = starter.presetId
    this.result = starter.result
    this.explanation = starter.explanation
    this.created = starter.created
    this.updated = starter.updated
  }

  get asObject(): ExperimentType {
    return JSON.parse(JSON.stringify(this))
  }
}

/** Saved experiments may be class instances or plain objects. Both are stored as plain data. */
export const serializeExperiment = (item: ExperimentType | ExperimentClass): ExperimentType =>
  item instanceof ExperimentClass ? item.asObject : JSON.parse(JSON.stringify(item))
