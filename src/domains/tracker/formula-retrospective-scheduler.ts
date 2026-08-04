import { get } from 'svelte/store'
import dayjs from 'dayjs'
import { TrackableStore } from '../trackable/TrackableStore'
import { calculateRetrospective, saveRetrospectiveValues } from '../../modules/formula/formula-retrospective'
import Storage from '../storage/storage'

const MAX_RETROSPECTIVE_DAYS = 5 // Testing: 5 days, will extend to 20 later
const SCHEDULER_STORAGE_KEY = 'formula_retrospective_last_run_date'
const SCHEDULER_DELAY_MS = 30000 // 30 seconds

/**
 * Check if retrospective calculation has already run today
 */
async function hasRunToday(): Promise<boolean> {
  try {
    const lastRunDate = await Storage.get(SCHEDULER_STORAGE_KEY)
    if (!lastRunDate) return false

    const lastRun = dayjs(lastRunDate as string)
    const today = dayjs().startOf('day')

    return lastRun.isSame(today, 'day')
  } catch (error) {
    console.error('[RetrospectiveScheduler] Error checking last run date:', error)
    return false
  }
}

/**
 * Mark today as the day when scheduler ran
 */
async function markRunDate(): Promise<void> {
  try {
    await Storage.put(SCHEDULER_STORAGE_KEY, dayjs().format('YYYY-MM-DD'))
  } catch (error) {
    console.error('[RetrospectiveScheduler] Error marking run date:', error)
  }
}

/**
 * Run retrospective calculations for all formula trackers
 * with retrospectiveCalculation enabled
 * Starts from yesterday, not today (today has no values yet)
 *
 * @param testingMode - If true, shows popup asking to run even if already ran today
 */
export async function runDailyRetrospectiveCalculation(testingMode: boolean = false): Promise<void> {
  const alreadyRanToday = await hasRunToday()

  // Check if already ran today
  if (alreadyRanToday && !testingMode) {
    console.log('[RetrospectiveScheduler] Already ran today, skipping')
    return
  }

  // In testing mode, ask user if they want to run anyway
  if (alreadyRanToday && testingMode) {
    return new Promise((resolve) => {
      // Show a simple confirmation by importing showToast
      console.log('[RetrospectiveScheduler] TESTING MODE: Showing confirmation dialog')

      // Use browser confirm for simplicity during testing
      const shouldRun = confirm(
        'Retrospective scheduler already ran today.\n\nRun anyway for testing purposes?\n\n(Will run after 10 seconds to allow stores to load)'
      )

      if (!shouldRun) {
        console.log('[RetrospectiveScheduler] User declined to run')
        resolve()
        return
      }

      console.log('[RetrospectiveScheduler] User confirmed to run, scheduling in 10 seconds')
      // Wait 10 seconds to ensure stores are fully loaded
      setTimeout(() => {
        executeScheduler()
          .then(() => resolve())
          .catch(() => resolve())
      }, 10000)
    })
  }

  // Normal flow: schedule with delay
  scheduleExecution()
}

/**
 * Execute the actual retrospective calculations (called after 30 second delay)
 */
async function executeScheduler(): Promise<void> {
  try {
    const trackableStore = get(TrackableStore)
    const trackables = trackableStore.trackables || {}

    // Find all formula trackers with retrospectiveCalculation enabled
    const formulaTrackers = Object.values(trackables)
      .filter(t => t?.type === 'tracker' && t?.tracker?.type === 'formula')
      .filter(t => t?.tracker?.retrospectiveCalculation)

    if (formulaTrackers.length === 0) {
      console.log('[RetrospectiveScheduler] No formula trackers with retrospectiveCalculation enabled')
      await markRunDate()
      return
    }

    console.log(`[RetrospectiveScheduler] Running for ${formulaTrackers.length} formula trackers`)

    // Process each formula tracker
    for (const trackable of formulaTrackers) {
      if (!trackable?.tracker) continue

      try {
        console.log(`[RetrospectiveScheduler] Processing ${trackable.tracker.tag}:`)
        console.log(`  - Formula: ${trackable.tracker.formula}`)
        console.log(`  - Dependencies: ${trackable.tracker.trackerDependencies?.join(', ')}`)
        console.log(`  - Existing calculated values: ${Object.keys(trackable.tracker.calculatedValues || {}).length} days`)
        if (trackable.tracker.calculatedValues) {
          console.log(`  - Calculated dates: ${Object.keys(trackable.tracker.calculatedValues).join(', ')}`)
        }

        // Start from yesterday, not today
        const startDate = dayjs().subtract(1, 'day')

        const result = await calculateRetrospective({
          tracker: trackable.tracker,
          knownTrackables: trackables,
          maxDays: MAX_RETROSPECTIVE_DAYS,
          startDate,
        })

        console.log(`[RetrospectiveScheduler] ${trackable.tracker.tag}:`)
        console.log(`  - Calculated: ${result.calculated.length} days ${result.calculated.map(r => r.date).join(', ')}`)
        console.log(`  - Skipped: ${result.skipped.length} days ${result.skipped.join(', ')}`)

        if (result.calculated.length > 0) {
          // Save the calculated values
          await saveRetrospectiveValues(trackable.tracker, result.calculated)
          console.log(
            `[RetrospectiveScheduler] ${trackable.tracker.tag}: Calculated and saved ${result.calculated.length} days`
          )
        } else {
          console.log(`[RetrospectiveScheduler] ${trackable.tracker.tag}: No days to calculate`)
        }
      } catch (error) {
        console.error(`[RetrospectiveScheduler] Error processing ${trackable?.tag}:`, error)
      }
    }

    // Mark that we ran today
    await markRunDate()
    console.log('[RetrospectiveScheduler] Completed successfully')
  } catch (error) {
    console.error('[RetrospectiveScheduler] Error:', error)
  }
}

/**
 * Schedule execution after 30 second delay
 */
function scheduleExecution(): void {
  console.log('[RetrospectiveScheduler] Scheduled to run in 30 seconds')
  setTimeout(() => {
    executeScheduler()
  }, SCHEDULER_DELAY_MS)
}
