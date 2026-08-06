import Storage from '../../domains/storage/storage'
import NPaths from '../../paths'
import appConfig from '../../config/appConfig'

export type PluginDuplicate = {
  pluginId: string
  pluginName: string
  count: number
  occurrences: Array<{
    location: string
    data: any
  }>
}

export type DedupResult = {
  totalPluginsInMainList: number
  pluginsWithDuplicates: Array<PluginDuplicate>
  totalDuplicateEntries: number
  hasDuplicates: boolean
}

/**
 * Scan for duplicate plugin entries in both plugins.json and individual plugin prefs
 * This is a read-only operation that only reports what would be cleaned
 */
export const scanForPluginDuplicates = async (): Promise<DedupResult> => {
  try {
    // Read the main plugins.json file
    const pluginsData = await Storage.get(NPaths.storage.plugins())

    if (!pluginsData || !Array.isArray(pluginsData)) {
      return {
        totalPluginsInMainList: 0,
        pluginsWithDuplicates: [],
        totalDuplicateEntries: 0,
        hasDuplicates: false,
      }
    }

    const result: DedupResult = {
      totalPluginsInMainList: pluginsData.length,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }

    // Group plugins by ID to find duplicates in main list
    const pluginsByIdInMain: Record<string, any[]> = {}
    pluginsData.forEach((plugin) => {
      const id = plugin.id || plugin.name
      if (!pluginsByIdInMain[id]) {
        pluginsByIdInMain[id] = []
      }
      pluginsByIdInMain[id].push({
        location: 'plugins.json',
        data: plugin,
      })
    })

    // Check for duplicates in main file
    Object.entries(pluginsByIdInMain).forEach(([pluginId, occurrences]) => {
      if (occurrences.length > 1) {
        const pluginName = occurrences[0].data.name || pluginId
        result.pluginsWithDuplicates.push({
          pluginId,
          pluginName,
          count: occurrences.length,
          occurrences,
        })
        result.totalDuplicateEntries += occurrences.length - 1 // Count extras
        result.hasDuplicates = true
      }
    })

    // Now check individual plugin prefs files
    // These are typically stored at: {data_root}/plugins/{pluginId}/prefs.json
    for (const plugin of pluginsData) {
      const pluginId = plugin.id
      const pluginName = plugin.name
      const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

      try {
        const prefsData = await Storage.get(prefsPath)

        if (prefsData) {
          // Check if prefs is an array (indicating duplicates due to sync conflicts)
          if (Array.isArray(prefsData) && prefsData.length > 1) {
            // Find or create duplicate entry
            let duplicateEntry = result.pluginsWithDuplicates.find(
              (d) => d.pluginId === pluginId
            )

            if (!duplicateEntry) {
              duplicateEntry = {
                pluginId,
                pluginName,
                count: 0,
                occurrences: [],
              }
              result.pluginsWithDuplicates.push(duplicateEntry)
              result.hasDuplicates = true
            }

            // Add prefs occurrences
            prefsData.forEach((pref) => {
              duplicateEntry!.occurrences.push({
                location: prefsPath,
                data: pref,
              })
            })

            duplicateEntry.count = duplicateEntry.occurrences.length
            result.totalDuplicateEntries += prefsData.length - 1
          }
        }
      } catch (e) {
        // Plugin prefs file doesn't exist or can't be read, which is fine
        // Some plugins may not have prefs
      }
    }

    return result
  } catch (e) {
    console.error('Error scanning for plugin duplicates:', e)
    throw e
  }
}

/**
 * Remove duplicate plugin entries (DESTRUCTIVE - actually modifies storage)
 * Only call after user confirmation
 */
export const cleanupPluginDuplicates = async (): Promise<DedupResult> => {
  try {
    const scanResult = await scanForPluginDuplicates()

    if (!scanResult.hasDuplicates) {
      return scanResult
    }

    // Clean up main plugins.json - keep only first occurrence of each ID
    const pluginsData = await Storage.get(NPaths.storage.plugins())
    const seen = new Set<string>()
    const cleaned = pluginsData.filter((plugin) => {
      const id = plugin.id || plugin.name
      if (seen.has(id)) {
        return false // Skip duplicates
      }
      seen.add(id)
      return true
    })

    // Save cleaned plugins list
    await Storage.put(NPaths.storage.plugins(), cleaned)

    // Clean up individual plugin prefs files
    for (const plugin of cleaned) {
      const pluginId = plugin.id
      const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

      try {
        const prefsData = await Storage.get(prefsPath)

        if (Array.isArray(prefsData) && prefsData.length > 1) {
          // Keep only the first (most recent) entry
          // CouchDB/PouchDB typically puts the most recent first
          const cleaned = prefsData[0]
          await Storage.put(prefsPath, cleaned)
        }
      } catch (e) {
        // Prefs file doesn't exist or can't be read - skip
      }
    }

    // Return clean scan result
    return {
      totalPluginsInMainList: cleaned.length,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }
  } catch (e) {
    console.error('Error cleaning plugin duplicates:', e)
    throw e
  }
}
