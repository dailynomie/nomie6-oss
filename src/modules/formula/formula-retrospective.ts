import dayjs, { Dayjs } from 'dayjs'
import { LedgerStore, saveLog } from '../../domains/ledger/LedgerStore'
import { FormulaEvaluator } from './index'
import type TrackerClass from '../tracker/TrackerClass'
import logsToTrackableUsage from '../../domains/usage/usage-utils'
import type { ITrackables } from '../../domains/ledger/ledger-tools'
import NLog from '../../domains/nomie-log/nomie-log'

export interface RetrospectiveCalculationProps {
  tracker: TrackerClass
  knownTrackables: ITrackables
  maxDays?: number
  startDate?: Dayjs
}

/**
 * Get the value for a formula tracker on a specific date
 * by querying the ledger for that date and calculating the formula
 */
export async function getFormulaValueForDate(
  tracker: TrackerClass,
  date: Dayjs,
  knownTrackables: ITrackables
): Promise<number | null> {
  if (!tracker.formula) return null

  const start = dayjs(date).startOf('day')
  const end = dayjs(date).endOf('day')

  // Query logs for this specific day
  const logs: Array<NLog> = await LedgerStore.query({ start, end })

  // Convert logs to trackable usage (respects tracker.math - sum/average)
  const usages = logsToTrackableUsage(logs, { trackables: knownTrackables })

  // Build context for formula evaluation
  const context = {
    trackerValues: Object.fromEntries(
      (tracker.trackerDependencies || []).map(tag => {
        const usage = usages[`#${tag}`]
        const value = usage?.total || 0
        return [tag, value]
      })
    ),
  }

  const result = FormulaEvaluator.evaluate(tracker.formula, context)
  return result.isValid ? result.value : null
}

/**
 * Calculate formula values for dates that don't already have a logged value
 * respects the tracker.math configuration for dependency trackers
 */
export async function calculateRetrospective(
  props: RetrospectiveCalculationProps
): Promise<{ calculated: { date: string; value: number }[]; skipped: string[] }> {
  const { tracker, knownTrackables, maxDays = 20, startDate } = props

  if (!tracker.formula || !tracker.trackerDependencies?.length) {
    return { calculated: [], skipped: [] }
  }

  const today = dayjs()
  const calculatedValues: { date: string; value: number }[] = []
  const skippedDates: string[] = []

  // Iterate through the specified number of days
  for (let i = 0; i < maxDays; i++) {
    const checkDate = startDate ? dayjs(startDate).subtract(i, 'day') : today.subtract(i, 'day')

    const dateKey = checkDate.format('YYYY-MM-DD')

    // Skip if formula tracker already has a value for this day
    if (tracker.calculatedValues?.[dateKey]) {
      skippedDates.push(dateKey)
      continue
    }

    // Check if there's already a logged value for the formula tracker on this day
    const existingLogs: Array<NLog> = await LedgerStore.query({
      start: checkDate.startOf('day'),
      end: checkDate.endOf('day'),
    })

    const hasExistingValue = existingLogs.some(log => {
      return log.getTrackables({}).find(t => t.tag === `#${tracker.tag}`)
    })

    if (hasExistingValue) {
      skippedDates.push(dateKey)
      console.log(`[FormulaRetrospective] ${dateKey}: Skipped (existing value found)`)
      continue
    }

    // Calculate the value for this date
    const value = await getFormulaValueForDate(tracker, checkDate, knownTrackables)

    console.log(`[FormulaRetrospective] ${dateKey}: Calculated = ${value}`)

    if (value !== null && !isNaN(value)) {
      calculatedValues.push({
        date: dateKey,
        value,
      })
    } else {
      console.log(`[FormulaRetrospective] ${dateKey}: Value is null/NaN, skipping`)
    }
  }

  return { calculated: calculatedValues, skipped: skippedDates }
}

/**
 * Save calculated formula values as logs to the ledger
 * Creates a Nomie note entry for each calculated value
 */
export async function saveRetrospectiveValues(
  tracker: TrackerClass,
  calculatedValues: { date: string; value: number }[]
): Promise<void> {
  if (!calculatedValues.length) return

  for (const { date, value } of calculatedValues) {
    const logDate = dayjs(date, 'YYYY-MM-DD').toDate()

    // Create a Nomie log entry with the format: #trackername(value)
    const log = new NLog({
      note: `#${tracker.tag}(${value})`,
      end: logDate,
    })

    try {
      // Save to ledger
      await saveLog(log)
      console.log(`[FormulaRetrospective] Saved #${tracker.tag}(${value}) on ${date}`)
    } catch (error) {
      console.error(`[FormulaRetrospective] Error saving ${tracker.tag} on ${date}:`, error)
    }
  }
}
