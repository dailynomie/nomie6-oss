import dayjs, { Dayjs } from 'dayjs'
import { LedgerStore, onLogNoteChange } from '../../domains/ledger/LedgerStore'
import { FormulaEvaluator } from './index'
import type TrackerClass from '../tracker/TrackerClass'
import type { ITrackables } from '../../domains/ledger/ledger-tools'
import type NLog from '../../domains/nomie-log/nomie-log'

export interface RecalculationResult {
  date: string
  oldValue: number | null
  newValue: number
  success: boolean
  error?: string
}

/**
 * Calculate formula value for a specific date using tracker dependencies from that day
 */
export async function calculateFormulaForDate(
  tracker: TrackerClass,
  date: Dayjs,
  knownTrackables: ITrackables
): Promise<number | null> {
  if (!tracker.formula) return null

  const start = dayjs(date).startOf('day')
  const end = dayjs(date).endOf('day')

  // Query all logs for this date
  const logs: Array<NLog> = await LedgerStore.query({ start, end })

  // Extract values for each dependency tracker from the logs
  const usages = await Promise.all(
    (tracker.trackerDependencies || []).map(async (tag) => {
      const depLogs = logs.filter((log) => log.hasTracker(tag))

      // Collect all values for this tracker
      const values: number[] = []
      depLogs.forEach((log) => {
        if (log.hasTracker(tag)) {
          const value = log.getTrackerValue(tag, 'sum')
          if (!isNaN(value)) {
            values.push(value)
          }
        }
      })

      // Apply math config (sum or average)
      const trackable = knownTrackables[`#${tag}`]
      let total = 0
      if (values.length > 0) {
        if (trackable?.tracker?.math === 'mean') {
          total = values.reduce((a, b) => a + b, 0) / values.length
        } else {
          total = values.reduce((a, b) => a + b, 0)
        }
      }

      return { tag, value: total }
    })
  )

  // Evaluate formula with dependency values
  const context = {
    trackerValues: Object.fromEntries(usages.map((u) => [u.tag, u.value])),
    manualVariables: Object.fromEntries((tracker.manualVariables || []).map((v) => [v, 0])),
  }

  const result = FormulaEvaluator.evaluate(tracker.formula, context)
  return result.isValid ? result.value : null
}

/**
 * Extract tracker value from a note (e.g., "#trackername(value)")
 */
export function extractTrackerValueFromNote(note: string, trackerTag: string): number | null {
  const pattern = new RegExp(`#${trackerTag}\\(([-\\d.]+)\\)`)
  const match = note.match(pattern)
  if (!match) return null

  const value = parseFloat(match[1])
  return isNaN(value) ? null : value
}

/**
 * Replace tracker value in a note
 */
export function replaceTrackerValueInNote(note: string, trackerTag: string, newValue: number): string {
  const pattern = new RegExp(`#${trackerTag}\\(([-\\d.]+)\\)`)
  return note.replace(pattern, `#${trackerTag}(${newValue.toFixed(2)})`)
}

/**
 * Recalculate formula values for a date range and update existing logs
 */
export async function recalculateFormulaRange(
  tracker: TrackerClass,
  knownTrackables: ITrackables,
  maxDays: number = 365
): Promise<RecalculationResult[]> {
  if (!tracker.formula || !tracker.trackerDependencies?.length) {
    return []
  }

  const results: RecalculationResult[] = []
  const today = dayjs()

  // Process each day going backward
  for (let i = 0; i < maxDays; i++) {
    const checkDate = today.subtract(i, 'day')
    const dateKey = checkDate.format('YYYY-MM-DD')

    try {
      // Query logs for this day
      const logs: Array<NLog> = await LedgerStore.query({
        start: checkDate.startOf('day'),
        end: checkDate.endOf('day'),
      })

      // Find the log with this formula tracker
      const formulaLog = logs.find((log) => log.hasTracker(tracker.tag))
      if (!formulaLog) {
        continue
      }

      // Extract old value and calculate new value
      const oldValue = extractTrackerValueFromNote(formulaLog.note, tracker.tag)
      const newValue = await calculateFormulaForDate(tracker, checkDate, knownTrackables)

      if (newValue === null || isNaN(newValue)) {
        results.push({
          date: dateKey,
          oldValue,
          newValue: 0,
          success: false,
          error: 'Failed to calculate new value',
        })
        continue
      }

      // Update the note with new value
      const updatedNote = replaceTrackerValueInNote(formulaLog.note, tracker.tag, newValue)

      // Use onLogNoteChange to persist the update (same method used in timeline)
      await onLogNoteChange(updatedNote, formulaLog)

      results.push({
        date: dateKey,
        oldValue,
        newValue,
        success: true,
      })
    } catch (error) {
      console.error(`[FormulaRecalculation] Error processing ${dateKey}:`, error)
      results.push({
        date: dateKey,
        oldValue: null,
        newValue: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
