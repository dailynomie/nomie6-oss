import Storage from '../../domains/storage/storage'
import NPaths from '../../paths'
import appConfig from '../../config/appConfig'

export type PluginDuplicate = {
  pluginId: string
  pluginName: string
  duplicatesFound: number
  fileLocation: string
}

export type DedupResult = {
  totalPluginsInMainList: number
  pluginsWithDuplicates: Array<PluginDuplicate>
  totalDuplicateEntries: number
  hasDuplicates: boolean
}

/**
 * Remove duplicates from an array by comparing JSON serialization
 */
const deduplicateArray = (arr: any[]): any[] => {
  const seen = new Set<string>()
  const unique: any[] = []

  arr.forEach((item) => {
    const key = JSON.stringify(item)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    }
  })

  return unique
}

/**
 * Scan JSON files for duplicate entries within the file content
 * This is a read-only operation that only reports what would be cleaned
 */
export const scanForPluginDuplicates = async (): Promise<DedupResult> => {
  try {
    // Read the main plugins.json file
    const pluginsData = await Storage.get(NPaths.storage.plugins())

    const result: DedupResult = {
      totalPluginsInMainList: 0,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }

    // Check plugins.json for duplicates
    if (pluginsData && Array.isArray(pluginsData)) {
      result.totalPluginsInMainList = pluginsData.length

      const uniquePlugins = deduplicateArray(pluginsData)
      const duplicatesInMain = pluginsData.length - uniquePlugins.length

      if (duplicatesInMain > 0) {
        result.pluginsWithDuplicates.push({
          pluginId: 'plugins.json',
          pluginName: 'Main Plugin List',
          duplicatesFound: duplicatesInMain,
          fileLocation: NPaths.storage.plugins(),
        })
        result.totalDuplicateEntries += duplicatesInMain
        result.hasDuplicates = true
      }

      // Now check individual plugin prefs files for duplicates
      for (const plugin of uniquePlugins) {
        const pluginId = plugin.id
        const pluginName = plugin.name
        const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

        try {
          const prefsData = await Storage.get(prefsPath)

          // Check if prefs is an array with duplicates
          if (prefsData && Array.isArray(prefsData)) {
            const uniquePrefs = deduplicateArray(prefsData)
            const duplicatesInPrefs = prefsData.length - uniquePrefs.length

            if (duplicatesInPrefs > 0) {
              result.pluginsWithDuplicates.push({
                pluginId,
                pluginName,
                duplicatesFound: duplicatesInPrefs,
                fileLocation: prefsPath,
              })
              result.totalDuplicateEntries += duplicatesInPrefs
              result.hasDuplicates = true
            }
          }
        } catch (e) {
          // Plugin prefs file doesn't exist or can't be read, which is fine
          // Some plugins may not have prefs
        }
      }
    }

    return result
  } catch (e) {
    console.error('Error scanning for plugin duplicates:', e)
    throw e
  }
}

/**
 * Remove duplicate entries from JSON files (DESTRUCTIVE - actually modifies storage)
 * Only call after user confirmation
 */
export const cleanupPluginDuplicates = async (): Promise<DedupResult> => {
  try {
    const scanResult = await scanForPluginDuplicates()

    if (!scanResult.hasDuplicates) {
      return scanResult
    }

    // Clean up plugins.json - remove duplicate entries
    const pluginsData = await Storage.get(NPaths.storage.plugins())
    if (pluginsData && Array.isArray(pluginsData)) {
      const cleanedPlugins = deduplicateArray(pluginsData)
      await Storage.put(NPaths.storage.plugins(), cleanedPlugins)
    }

    // Re-read cleaned plugins data for processing prefs
    const cleanedPluginsData = await Storage.get(NPaths.storage.plugins())

    // Clean up individual plugin prefs files
    if (cleanedPluginsData && Array.isArray(cleanedPluginsData)) {
      for (const plugin of cleanedPluginsData) {
        const pluginId = plugin.id
        const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

        try {
          const prefsData = await Storage.get(prefsPath)

          if (prefsData && Array.isArray(prefsData)) {
            const cleanedPrefs = deduplicateArray(prefsData)
            // Only save if there were duplicates
            if (cleanedPrefs.length < prefsData.length) {
              await Storage.put(prefsPath, cleanedPrefs)
            }
          }
        } catch (e) {
          // Prefs file doesn't exist or can't be read - skip
        }
      }
    }

    // Return clean scan result
    return {
      totalPluginsInMainList: cleanedPluginsData ? cleanedPluginsData.length : 0,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }
  } catch (e) {
    console.error('Error cleaning plugin duplicates:', e)
    throw e
  }
}
