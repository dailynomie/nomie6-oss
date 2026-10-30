import { AppVersion } from '../../modules/app-version/app-version'
import type { ITrackables } from '../trackable/trackable-utils'
import { updateAllLastUsed } from './UsageStore'

const FLAG_KEY = 'usage-rebuilt-version'

/**
 * Rebuild the last used and streak data once for each app version on this device,
 * so values that were wrong before the fix are corrected.
 * Runs in the background after boot, and retries on the next start if it fails.
 * @param trackables
 */
export const rebuildUsageOnNewVersion = async (trackables: ITrackables) => {
  try {
    if (localStorage.getItem(FLAG_KEY) === AppVersion) return
    await updateAllLastUsed(trackables)
    localStorage.setItem(FLAG_KEY, AppVersion)
  } catch (e) {
    console.error('Usage rebuild failed', e)
  }
}
