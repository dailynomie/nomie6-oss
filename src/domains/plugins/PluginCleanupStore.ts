import { derived, writable } from 'svelte/store'
import dayjs from 'dayjs'
import { Prefs } from '../preferences/Preferences'
import { cleanupPluginDuplicates, type DedupResult } from './plugin-dedup'
import { showToast } from '../../components/toast/ToastStore'

const CLEANUP_STORAGE_KEY = 'last-plugin-cleanup-date'
const CLEANUP_LOG_KEY = 'last-plugin-cleanup-log'

export type CleanupLogEntry = {
  date: string
  type: 'manual' | 'scheduled'
  duplicatesFound: number
  rogueFoldersFound: number
  totalPlugins: number
}

export const PluginCleanupStore = writable<undefined | string>(
  localStorage.getItem(CLEANUP_STORAGE_KEY)
)

PluginCleanupStore.subscribe((s) => {
  if (s) {
    localStorage.setItem(CLEANUP_STORAGE_KEY, s)
  }
})

/**
 * Calculate days since last plugin cleanup
 */
export const CleanupDaysAgo = derived(PluginCleanupStore, ($PluginCleanupStore) => {
  if (!$PluginCleanupStore) {
    return 9000
  }
  return dayjs().diff(new Date($PluginCleanupStore), 'day')
})

/**
 * Mark cleanup as completed by updating last cleanup timestamp
 */
export const cleanupConfirmed = async () => {
  PluginCleanupStore.update(() => new Date().toJSON())
}

/**
 * Get the last cleanup log entry
 */
export const getLastCleanupLog = (): CleanupLogEntry | null => {
  const log = localStorage.getItem(CLEANUP_LOG_KEY)
  return log ? JSON.parse(log) : null
}

/**
 * Save cleanup results to log
 */
export const saveCleanupLog = (result: DedupResult, type: 'manual' | 'scheduled' = 'manual') => {
  const logEntry: CleanupLogEntry = {
    date: new Date().toISOString(),
    type,
    duplicatesFound: result.totalDuplicateEntries,
    rogueFoldersFound: result.totalRogueFolders,
    totalPlugins: result.totalPluginsInMainList,
  }
  localStorage.setItem(CLEANUP_LOG_KEY, JSON.stringify(logEntry))
  console.log(`[PluginCleanup] Saved ${type} cleanup log:`, logEntry)
}

/**
 * Auto-cleanup plugin database if interval has been met
 * Called on app boot to silently run cleanup if needed
 */
export const autoCleanupPlugins = async (): Promise<boolean> => {
  try {
    console.log('[PluginCleanup] Starting auto-cleanup scheduler...')

    // Get current preferences
    let prefs: any
    Prefs.subscribe((p) => {
      prefs = p
    })()

    // Check if cleanup is enabled
    if (!prefs || prefs.pluginCleanupDays === undefined || prefs.pluginCleanupDays === -1) {
      console.log('[PluginCleanup] Auto-cleanup is disabled (pluginCleanupDays: -1)')
      return false
    }

    console.log(`[PluginCleanup] Auto-cleanup interval: ${prefs.pluginCleanupDays} days`)

    // Get days since last cleanup
    const lastCleanup = localStorage.getItem(CLEANUP_STORAGE_KEY)
    if (!lastCleanup) {
      // First cleanup, run it
      console.log('[PluginCleanup] No previous cleanup found - running initial cleanup')
      try {
        const result = await cleanupPluginDuplicates()
        console.log('[PluginCleanup] Initial cleanup completed:', {
          hasDuplicates: result.hasDuplicates,
          totalDuplicateEntries: result.totalDuplicateEntries,
          totalRogueFolders: result.totalRogueFolders,
          totalPluginsInMainList: result.totalPluginsInMainList,
        })
        if (result.hasDuplicates) {
          await cleanupConfirmed()
          saveCleanupLog(result, 'scheduled')
          showToast({
            message: `Plugin database cleaned (${result.totalDuplicateEntries} duplicates, ${result.totalRogueFolders} rogue folders)`,
            type: 'success',
          })
        }
        return true
      } catch (e) {
        console.error('[PluginCleanup] Error during auto-cleanup:', e)
        return false
      }
    }

    // Check if enough days have passed
    const daysSinceCleanup = dayjs().diff(new Date(lastCleanup), 'day')
    console.log(`[PluginCleanup] Days since last cleanup: ${daysSinceCleanup}`)

    if (daysSinceCleanup >= prefs.pluginCleanupDays) {
      console.log(`[PluginCleanup] Interval elapsed (${daysSinceCleanup} >= ${prefs.pluginCleanupDays}) - running cleanup`)
      try {
        const result = await cleanupPluginDuplicates()
        console.log('[PluginCleanup] Cleanup completed:', {
          hasDuplicates: result.hasDuplicates,
          totalDuplicateEntries: result.totalDuplicateEntries,
          totalRogueFolders: result.totalRogueFolders,
          totalPluginsInMainList: result.totalPluginsInMainList,
        })
        if (result.hasDuplicates) {
          await cleanupConfirmed()
          saveCleanupLog(result, 'scheduled')
          showToast({
            message: `Plugin database cleaned (${result.totalDuplicateEntries} duplicates, ${result.totalRogueFolders} rogue folders)`,
            type: 'success',
          })
        }
        return true
      } catch (e) {
        console.error('[PluginCleanup] Error during auto-cleanup:', e)
        return false
      }
    }

    console.log(`[PluginCleanup] Interval not yet elapsed - next cleanup in ${prefs.pluginCleanupDays - daysSinceCleanup} days`)
    return false
  } catch (e) {
    console.error('[PluginCleanup] Error in autoCleanupPlugins:', e)
    return false
  }
}
