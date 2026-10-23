import dayjs from 'dayjs'
import { get } from 'svelte/store'
import { LedgerStore } from '../ledger/LedgerStore'
import { TrackableStore, saveTrackable } from './TrackableStore'
import TrackerClass from '../../modules/tracker/TrackerClass'
import Person from '../people/Person.class'
import { ContextClass } from '../context/context-class'
import { PointerClass } from '../pointers/pointer-class'
import { removeTagFromNote } from './unknown-tag-text'
import { Prefs } from '../preferences/Preferences'

/**
 * Unknown trackables: a #tag, @person, +context or ^pointer in a note that has no trackable in the app.
 * They are listed in Settings > Manage Unknown Trackables. The user can create one, or delete the tag from the notes.
 */
export type UnknownType = 'tracker' | 'person' | 'context' | 'pointer'

export type UnknownItem = {
  key: string // the tag as written in a note, for example #walk
  type: UnknownType
  id: string // the tag without its prefix
  count: number // number of notes that use it
}

const TYPE_BY_PREFIX: Record<string, UnknownType> = { '#': 'tracker', '@': 'person', '+': 'context', '^': 'pointer' }

/** Every unknown tag in every note, grouped by type. */
export const findUnknownTrackables = async (): Promise<Array<UnknownItem>> => {
  const known = get(TrackableStore).trackables
  const logs = await LedgerStore.query({ start: dayjs('2000-01-01'), end: dayjs().endOf('day') } as any)
  const found = new Map<string, UnknownItem>()
  for (const log of logs) {
    const seenInNote = new Set<string>()
    for (const token of log.elements) {
      const type = TYPE_BY_PREFIX[token.prefix]
      if (!type) continue
      const key = `${token.prefix}${token.id}`
      if (known[key] || seenInNote.has(key)) continue
      seenInNote.add(key)
      const item = found.get(key) || { key, type, id: token.id, count: 0 }
      item.count += 1
      found.set(key, item)
    }
  }
  const order: Array<UnknownType> = ['tracker', 'person', 'context', 'pointer']
  return [...found.values()].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.key.localeCompare(b.key))
}

/** The tags the user chose to ignore. They are not trackables and their notes are not changed. */
export const ignoredUnknownTags = (): Array<string> => get(Prefs).ignoredUnknownTags || []

export const setUnknownTagIgnored = (key: string, ignored: boolean) => {
  Prefs.update((p) => {
    const current = (p.ignoredUnknownTags || []).filter((k) => k !== key)
    return { ...p, ignoredUnknownTags: ignored ? [...current, key] : current }
  })
}

/** Create the trackable for an unknown tag. It is added to the Track screen, as a new tracker is. */
export const createUnknownTrackable = async (item: UnknownItem): Promise<boolean> => {
  let trackable
  if (item.type === 'tracker') trackable = new TrackerClass({ tag: item.id }).toTrackable()
  else if (item.type === 'person') trackable = new Person({ username: item.id }).toTrackable()
  else if (item.type === 'context') trackable = new ContextClass(item.id).toTrackable()
  else trackable = new PointerClass(item.id).toTrackable()
  // a tag that becomes a trackable is no longer ignored
  setUnknownTagIgnored(item.key, false)
  return saveTrackable({
    trackable,
    known: get(TrackableStore).trackables,
    permissions: {},
    prompt: false,
  })
}

/** Delete an unknown tag: it is removed from every note that uses it. */
export const deleteUnknownTrackable = async (item: UnknownItem): Promise<number> => {
  const logs = await LedgerStore.query({ start: dayjs('2000-01-01'), end: dayjs().endOf('day') } as any)
  let changed = 0
  for (const log of logs) {
    if (!log.elements.some((t) => `${t.prefix}${t.id}` === item.key)) continue
    const before = log.note
    log.note = removeTagFromNote(before, item.key)
    if (log.note !== before) {
      await LedgerStore.updateLog(log)
      changed += 1
    }
  }
  return changed
}
