import { get } from 'svelte/store'
import trackables from '../library/all-individual-trackers.json'
import TrackerClass from '../../modules/tracker/TrackerClass'
import { UOMClass } from '../uom/uom.class'
import { ActiveBoard, addTrackablesToBoard, UniboardStore } from '../board/UniboardStore'
import { saveTrackable } from '../trackable/TrackableStore'
import { getRawPrefs } from '../preferences/Preferences'
import type { ITrackables } from '../trackable/trackable-utils'
import type { Trackable } from '../trackable/Trackable.class'

const libraryEntry = (tag: string): any => (trackables.trackables as Array<any>).find((t) => t.tracker?.tag === tag)

/** True when the tracker library has a tracker with this tag, so an experiment preset can offer to install it. */
export const hasLibraryTracker = (tag: string): boolean => !!libraryEntry(tag)

export const libraryTrackerLabel = (tag: string): string | undefined => libraryEntry(tag)?.tracker?.label

/**
 * Install a tracker from the library, the same way the library does: converted to the user's
 * measurement system, then added to the active board. Returns the existing tracker if it is already installed.
 */
export const installLibraryTracker = async (tag: string, known: ITrackables): Promise<Trackable | undefined> => {
  const existing = known[`#${tag}`]
  if (existing) return existing

  const entry = libraryEntry(tag)
  if (!entry) return undefined

  const tracker = new TrackerClass(entry.tracker)
  const uom = new UOMClass(tracker.uom as string)
  const userSystem = getRawPrefs().useMetric ? 'metric' : 'imperial'
  if (uom.system !== userSystem && uom.system !== 'both') {
    tracker.uom = uom.convertTo(userSystem).id
    tracker.default = uom.convertValueTo(tracker.default || 0, userSystem)
  }

  const trackable = tracker.toTrackable()
  const saved = await saveTrackable({
    trackable,
    known,
    saveToActiveBoard: false,
    permissions: {},
    prompt: false,
  })
  if (!saved) return undefined

  const board = get(ActiveBoard)
  if (board) await addTrackablesToBoard([trackable], board)
  UniboardStore.update((b) => b)
  return trackable
}
