import { derived, writable } from 'svelte/store'
import dayjs from 'dayjs'
import { Prefs } from '../preferences/Preferences'
import { cleanupPluginDuplicates } from './plugin-dedup'
import { showToast } from '../../components/toast/ToastStore'

const CLEANUP_STORAGE_KEY = 'last-plugin-cleanup-date'

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
 * Auto-cleanup plugin database if interval has been met
 * Called on app boot to silently run cleanup if needed
 */
export const autoCleanupPlugins = async (): Promise<boolean> => {
  try {
    // Get current preferences
    let prefs: any
    Prefs.subscribe((p) => {
      prefs = p
    })()

    // Check if cleanup is enabled
    if (!prefs || prefs.pluginCleanupDays === undefined || prefs.pluginCleanupDays === -1) {
      return false
    }

    // Get days since last cleanup
    const lastCleanup = localStorage.getItem(CLEANUP_STORAGE_KEY)
    if (!lastCleanup) {
      // First cleanup, run it
      try {
        const result = await cleanupPluginDuplicates()
        if (result.hasDuplicates) {
          await cleanupConfirmed()
          showToast({
            message: `Plugin database cleaned (${result.totalDuplicateEntries} duplicates, ${result.totalRogueFolders} rogue folders)`,
            type: 'success',
          })
        }
        return true
      } catch (e) {
        console.error('Error during auto-cleanup:', e)
        return false
      }
    }

    // Check if enough days have passed
    const daysSinceCleanup = dayjs().diff(new Date(lastCleanup), 'day')
    if (daysSinceCleanup >= prefs.pluginCleanupDays) {
      try {
        const result = await cleanupPluginDuplicates()
        if (result.hasDuplicates) {
          await cleanupConfirmed()
          showToast({
            message: `Plugin database cleaned (${result.totalDuplicateEntries} duplicates, ${result.totalRogueFolders} rogue folders)`,
            type: 'success',
          })
        }
        return true
      } catch (e) {
        console.error('Error during auto-cleanup:', e)
        return false
      }
    }

    return false
  } catch (e) {
    console.error('Error in autoCleanupPlugins:', e)
    return false
  }
}
