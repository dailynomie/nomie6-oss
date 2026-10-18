import dayjs from 'dayjs'
import { getBoardsFromStorage, saveBoardsToStorageAndUpdate } from '../board/UniboardStore'
import NLog from '../nomie-log/nomie-log'
import { saveLog } from '../ledger/LedgerStore'
import type { ITrackables } from '../trackable/trackable-utils'
import type { ExperimentType } from './experiment-class'
import { DAY_FORMAT } from './experiment-data'
import { loadActiveDays, loadDailyValues } from './experiment-query'
import type { ResultInput } from './experiment-result'

const trackerFor = (known: ITrackables, tag: string): any =>
  Object.values(known).find((t: any) => t.tracker?.tag === tag)

/** Everything the live result needs: from the start of the baseline up to today or the end. */
export const loadResultInput = async (experiment: ExperimentType, known: ITrackables): Promise<ResultInput> => {
  const today = dayjs().startOf('day')
  const start = dayjs(experiment.start).startOf('day')
  const lastDay = start.add(experiment.durationDays - 1, 'day')
  const end = today.isBefore(lastDay, 'day') ? today : lastDay
  const baselineStart = start.subtract(experiment.baselineDays ?? experiment.durationDays, 'day')

  const activeDays = await loadActiveDays(baselineStart, end)
  const outcomeValues: ResultInput['outcomeValues'] = {}
  const missingAs: ResultInput['missingAs'] = {}
  for (const outcome of experiment.outcomes) {
    outcomeValues[outcome.tag] = await loadDailyValues(outcome.tag, baselineStart, end, known)
    missingAs[outcome.tag] = trackerFor(known, outcome.tag)?.tracker?.math === 'mean' ? 'skip' : 'zero'
  }
  const adherence = await loadDailyValues(experiment.adherenceTag, start, end, known)

  return {
    experiment,
    today: today.format(DAY_FORMAT),
    activeDays,
    outcomeValues,
    missingAs,
    adherence,
  }
}

/** Save one day's check-in as a log on that day, using the experiment's check-in tracker. */
export const recordCheckIn = async (experiment: ExperimentType, day: string, kept: boolean): Promise<void> => {
  const log = new NLog({
    note: `#${experiment.adherenceTag}(${kept ? 1 : -1})`,
    end: dayjs(day).hour(12).toDate(),
  })
  await saveLog(log)
}

/** Take the check-in tracker off every board. The tracker and its logs are kept. */
export const removeCheckInFromBoards = async (adherenceTag: string): Promise<void> => {
  const boards = await getBoardsFromStorage()
  const tag = `#${adherenceTag}`
  let changed = false
  boards.forEach((board) => {
    const kept = board.elements.filter((element) => element !== tag)
    if (kept.length !== board.elements.length) {
      board.elements = kept
      changed = true
    }
  })
  if (changed) await saveBoardsToStorageAndUpdate(boards)
}
