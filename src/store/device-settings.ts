/**
 * Device-only settings and small caches. They stay on this device and are never synced.
 *
 * Every key keeps the exact string the app has always used, so existing values are read
 * without any migration. Components and stores use these functions, not localStorage directly
 * (guardrails STO-06). The nomie-server keys are not listed here: that engine is not active yet.
 */
export const DEVICE_KEYS = {
  launchCount: 'launchCount',
  lastDashIndex: 'last-dash-index',
  lastBoard: 'last-known-board',
  lastBackupDate: 'last-backup-date',
  lastPluginCleanupDate: 'last-plugin-cleanup-date',
  lastPluginCleanupLog: 'last-plugin-cleanup-log',
  locationCache: 'loc-cache',
  fontSize: 'fontSize',
  language: 'n4-lang',
  pwaUpdateState: 'nomie_pwa_update_state',
  recentEmojis: 'recent-emojis',
} as const

export type DeviceKey = (typeof DEVICE_KEYS)[keyof typeof DEVICE_KEYS]

/**
 * Read a device setting. Returns null when it is not set, or when the browser refuses access.
 */
export const getDeviceSetting = (key: DeviceKey): string | null => {
  try {
    return localStorage.getItem(key)
  } catch (e) {
    console.warn(`Device setting ${key} could not be read`, e)
    return null
  }
}

/**
 * Save a device setting. A browser that refuses storage (for example private mode) does not
 * stop the app: the setting is kept for this session only.
 */
export const setDeviceSetting = (key: DeviceKey, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.warn(`Device setting ${key} could not be saved`, e)
  }
}

export const removeDeviceSetting = (key: DeviceKey): void => {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(`Device setting ${key} could not be removed`, e)
  }
}
