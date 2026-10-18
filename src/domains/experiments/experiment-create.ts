import nid from '../../modules/nid/nid'
import TrackerClass from '../../modules/tracker/TrackerClass'
import { saveTrackable } from '../trackable/TrackableStore'
import type { ITrackables } from '../trackable/trackable-utils'
import { ExperimentClass, type ExperimentOutcome } from './experiment-class'
import { ExperimentStore } from './ExperimentStore'
import { adherenceTagFor } from './experiment-data'

export const KEPT_TO_IT = 'Kept to it'
export const DID_NOT = "Didn't"

/** The habit tracker that records each day's check-in. */
export const buildAdherenceTracker = (tag: string, label: string): TrackerClass =>
  new TrackerClass({
    tag,
    label,
    type: 'habit',
    math: 'mean',
    habitChoice: [KEPT_TO_IT, DID_NOT],
    emoji: '🧪',
  })

export type CreateExperimentInput = {
  title: string
  change: string
  outcomes: Array<ExperimentOutcome>
  start: string
  durationDays: number
  presetId?: string
}

/** Create the check-in tracker and save the experiment, which starts running. */
export const createExperiment = async (input: CreateExperimentInput, known: ITrackables): Promise<ExperimentClass> => {
  const existingTags = Object.values(known).map((t: any) => t.tag)
  const adherenceTag = adherenceTagFor(input.title, existingTags)

  const tracker = buildAdherenceTracker(adherenceTag, input.title)
  const saved = await saveTrackable({
    trackable: tracker.toTrackable(),
    known,
    permissions: {},
    prompt: false,
  })
  if (!saved) throw new Error('The check-in tracker could not be created')

  const experiment = new ExperimentClass({
    ...input,
    id: nid(),
    adherenceTag,
    status: 'running',
    created: new Date().toJSON(),
  })
  await ExperimentStore.upsert(experiment.asObject)
  return experiment
}
