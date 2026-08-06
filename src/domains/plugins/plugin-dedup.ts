import Storage from '../../domains/storage/storage'
import NPaths from '../../paths'
import appConfig from '../../config/appConfig'

export type PluginDuplicate = {
  pluginId: string
  pluginName: string
  count: number
  occurrences: Array<{
    location: string
    revisionInfo: string
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
 * Get all revisions of a document in PouchDB (including conflict revisions)
 * This is needed because sync conflicts create hidden revision branches
 */
const getAllRevisions = async (docId: string): Promise<any[]> => {
  try {
    const engine = Storage.getEngine()

    // Check if this is PouchDB - only PouchDB has direct db access
    if (engine.db && engine.db.allDocs) {
      const result = await engine.db.allDocs({
        keys: [docId],
        include_docs: true,
        conflicts: true,
      })

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0]
        if (row.doc && row.doc._conflicts) {
          // This document has conflicts - return all revisions
          const revisions = [row.doc]

          for (const conflictRev of row.doc._conflicts) {
            try {
              const conflictDoc = await engine.db.get(docId, { rev: conflictRev })
              revisions.push(conflictDoc)
            } catch (e) {
              // Could not fetch conflict revision
            }
          }

          return revisions
        } else if (row.doc) {
          // No conflicts, just return the document
          return [row.doc]
        }
      }
    }

    return []
  } catch (e) {
    console.error('Error getting revisions:', e)
    return []
  }
}

/**
 * Scan for duplicate plugin entries including CouchDB conflict revisions
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

    // Check for CouchDB conflict revisions in plugins.json
    const pluginsRevisions = await getAllRevisions(NPaths.storage.plugins())

    if (pluginsRevisions.length > 1) {
      result.pluginsWithDuplicates.push({
        pluginId: 'plugins.json',
        pluginName: 'Main Plugin List',
        count: pluginsRevisions.length,
        occurrences: pluginsRevisions.map((rev, idx) => ({
          location: `${NPaths.storage.plugins()} [revision ${idx + 1}]`,
          revisionInfo: `${rev._rev}`,
          data: rev.data || null,
        })),
      })
      result.totalDuplicateEntries += pluginsRevisions.length - 1
      result.hasDuplicates = true
    }

    if (pluginsData && Array.isArray(pluginsData)) {
      result.totalPluginsInMainList = pluginsData.length

      // Now check individual plugin prefs files for conflict revisions
      for (const plugin of pluginsData) {
        const pluginId = plugin.id
        const pluginName = plugin.name
        const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

        try {
          // Get all revisions including conflicts
          const prefsRevisions = await getAllRevisions(prefsPath)

          if (prefsRevisions.length > 1) {
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

            // Add prefs revisions
            prefsRevisions.forEach((rev, idx) => {
              duplicateEntry!.occurrences.push({
                location: `${prefsPath} [revision ${idx + 1}]`,
                revisionInfo: `${rev._rev}`,
                data: rev.data || null,
              })
            })

            duplicateEntry.count = prefsRevisions.length
            result.totalDuplicateEntries += prefsRevisions.length - 1
          }
        } catch (e) {
          // Plugin prefs file doesn't exist or can't be read, which is fine
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
 * Remove duplicate plugin entries and CouchDB conflict revisions (DESTRUCTIVE)
 * Only call after user confirmation
 */
export const cleanupPluginDuplicates = async (): Promise<DedupResult> => {
  try {
    const engine = Storage.getEngine()

    if (!engine.db) {
      throw new Error('This cleanup operation only works with PouchDB storage')
    }

    const scanResult = await scanForPluginDuplicates()

    if (!scanResult.hasDuplicates) {
      return scanResult
    }

    // Clean up plugins.json conflicts
    const pluginsDoc = await engine.db.get(NPaths.storage.plugins())
    if (pluginsDoc._conflicts) {
      // Remove all conflict revisions
      for (const conflictRev of pluginsDoc._conflicts) {
        try {
          const conflictDoc = await engine.db.get(NPaths.storage.plugins(), { rev: conflictRev })
          await engine.db.remove(conflictDoc)
        } catch (e) {
          console.error('Error removing conflict revision:', e)
        }
      }
    }

    // Re-read cleaned plugins data
    const pluginsData = await Storage.get(NPaths.storage.plugins())

    // Clean up individual plugin prefs conflicts
    if (pluginsData && Array.isArray(pluginsData)) {
      for (const plugin of pluginsData) {
        const pluginId = plugin.id
        const prefsPath = `${appConfig.data_root}/plugins/${pluginId}/prefs.json`

        try {
          const prefsDoc = await engine.db.get(prefsPath)

          if (prefsDoc._conflicts) {
            // Remove all conflict revisions, keep the winning revision
            for (const conflictRev of prefsDoc._conflicts) {
              try {
                const conflictDoc = await engine.db.get(prefsPath, { rev: conflictRev })
                await engine.db.remove(conflictDoc)
              } catch (e) {
                console.error('Error removing conflict revision:', e)
              }
            }
          }
        } catch (e) {
          // Prefs file doesn't exist or can't be read - skip
        }
      }
    }

    // Return clean scan result
    return {
      totalPluginsInMainList: pluginsData ? pluginsData.length : 0,
      pluginsWithDuplicates: [],
      totalDuplicateEntries: 0,
      hasDuplicates: false,
    }
  } catch (e) {
    console.error('Error cleaning plugin duplicates:', e)
    throw e
  }
}
