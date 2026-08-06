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
const deduplicateArray = (arr: any[]): { cleaned: any[]; removed: number } => {
  const seen = new Set<string>()
  const unique: any[] = []
  let removedCount = 0

  arr.forEach((item) => {
    const key = JSON.stringify(item)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    } else {
      removedCount++
    }
  })

  return { cleaned: unique, removed: removedCount }
}

/**
 * Recursively scan and deduplicate JSON structure at all levels
 * Finds duplicate objects/arrays within the same parent
 */
const recursiveDedup = (data: any): { cleaned: any; duplicatesFound: number } => {
  let duplicatesFound = 0

  // If it's an array at this level, deduplicate it
  if (Array.isArray(data)) {
    const result = deduplicateArray(data)
    duplicatesFound += result.removed

    // Recursively process each item in the array
    const processedArray = result.cleaned.map((item) => {
      const recursive = recursiveDedup(item)
      duplicatesFound += recursive.duplicatesFound
      return recursive.cleaned
    })

    return { cleaned: processedArray, duplicatesFound }
  }

  // If it's an object, recursively process each property
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const cleaned: Record<string, any> = {}

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key]

        // If this property is an array, deduplicate it
        if (Array.isArray(value)) {
          const result = deduplicateArray(value)
          duplicatesFound += result.removed

          // Recursively process array items
          cleaned[key] = result.cleaned.map((item) => {
            const recursive = recursiveDedup(item)
            duplicatesFound += recursive.duplicatesFound
            return recursive.cleaned
          })
        } else {
          // Recursively process the value
          const recursive = recursiveDedup(value)
          duplicatesFound += recursive.duplicatesFound
          cleaned[key] = recursive.cleaned
        }
      }
    }

    return { cleaned, duplicatesFound }
  }

  // Primitive value, return as-is
  return { cleaned: data, duplicatesFound }
}

/**
 * Scan JSON files for duplicate entries at any level of the JSON structure
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

    // Check plugins.json for duplicates (recursively at all levels)
    if (pluginsData) {
      if (Array.isArray(pluginsData)) {
        result.totalPluginsInMainList = pluginsData.length
      }

      const dedup = recursiveDedup(pluginsData)

      if (dedup.duplicatesFound > 0) {
        result.pluginsWithDuplicates.push({
          pluginId: 'plugins.json',
          pluginName: 'Main Plugin List',
          duplicatesFound: dedup.duplicatesFound,
          fileLocation: NPaths.storage.plugins(),
        })
        result.totalDuplicateEntries += dedup.duplicatesFound
        result.hasDuplicates = true
      }

      // Now check individual plugin prefs files for duplicates
      if (Array.isArray(pluginsData)) {
        for (const plugin of pluginsData) {
          const pluginId = plugin.id
          const pluginName = plugin.name
          const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

          try {
            const prefsData = await Storage.get(prefsPath)

            if (prefsData) {
              const dedup = recursiveDedup(prefsData)

              if (dedup.duplicatesFound > 0) {
                result.pluginsWithDuplicates.push({
                  pluginId,
                  pluginName,
                  duplicatesFound: dedup.duplicatesFound,
                  fileLocation: prefsPath,
                })
                result.totalDuplicateEntries += dedup.duplicatesFound
                result.hasDuplicates = true
              }
            }
          } catch (e) {
            // Plugin prefs file doesn't exist or can't be read, which is fine
            // Some plugins may not have prefs
          }
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

    // Clean up plugins.json - remove duplicates at all levels
    const pluginsData = await Storage.get(NPaths.storage.plugins())
    if (pluginsData) {
      const dedup = recursiveDedup(pluginsData)
      await Storage.put(NPaths.storage.plugins(), dedup.cleaned)
    }

    // Re-read cleaned plugins data for processing prefs
    const cleanedPluginsData = await Storage.get(NPaths.storage.plugins())

    // Clean up individual plugin prefs files
    if (Array.isArray(cleanedPluginsData)) {
      for (const plugin of cleanedPluginsData) {
        const pluginId = plugin.id
        const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

        try {
          const prefsData = await Storage.get(prefsPath)

          if (prefsData) {
            const dedup = recursiveDedup(prefsData)
            // Only save if there were duplicates
            if (dedup.duplicatesFound > 0) {
              await Storage.put(prefsPath, dedup.cleaned)
            }
          }
        } catch (e) {
          // Prefs file doesn't exist or can't be read - skip
        }
      }
    }

    // Return clean scan result
    return {
      totalPluginsInMainList: Array.isArray(cleanedPluginsData) ? cleanedPluginsData.length : 0,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }
  } catch (e) {
    console.error('Error cleaning plugin duplicates:', e)
    throw e
  }
}
