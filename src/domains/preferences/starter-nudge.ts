import dayjs from 'dayjs'
import { get } from 'svelte/store'
import { LedgerStore } from '../ledger/LedgerStore'
import { Interact } from '../../store/interact'
import { LaunchCount } from './LaunchCount'
import { Prefs, getRawPrefs } from './Preferences'
import { resolveExperience, shouldOfferStarterNudge, STARTER_NUDGE_DAYS, STARTER_NUDGE_LAUNCHES } from './experience'

/** Number of different days with at least one log, across all history. */
const countLoggedDays = async (): Promise<number> => {
  const logs = await LedgerStore.query({ start: dayjs(0), end: dayjs().endOf('day') })
  return new Set(logs.map((log: any) => log.endDayjs().format('YYYY-MM-DD'))).size
}

/** The question itself. Choosing "Show everything" turns on full mode. */
const askAboutFullMode = async (): Promise<void> => {
  const showEverything = await Interact.confirm(
    'Want to see everything Daily Nomie can do?',
    "You've been tracking for a while. Starter mode keeps things simple. You can switch back any time in Settings.",
    'Show everything',
    'Keep it simple'
  )
  if (showEverything) {
    Prefs.update((p) => {
      p.experience = 'full'
      return p
    })
  }
}

/**
 * Shown once, to starters only. Marked as shown before asking, so it never comes back,
 * even if the app closes while the question is open.
 */
export const checkStarterNudge = async (): Promise<void> => {
  const prefs = getRawPrefs()
  if (resolveExperience(prefs) !== 'starter' || prefs?.starterNudgeShown) return

  const launches = get(LaunchCount)
  // Only read the ledger when the launch count has not already decided it
  const loggedDays = launches >= STARTER_NUDGE_LAUNCHES ? STARTER_NUDGE_DAYS : await countLoggedDays()
  if (!shouldOfferStarterNudge(prefs, launches, loggedDays)) return

  Prefs.update((p) => {
    p.starterNudgeShown = true
    return p
  })
  await askAboutFullMode()
}

// TEMPORARY TEST HELPER, remove before release. Asks the nudge question now, without the 14-day or 30-launch rule.
export const testStarterNudge = async (): Promise<void> => {
  await askAboutFullMode()
}
