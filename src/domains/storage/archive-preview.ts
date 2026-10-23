// F2: what a restore would change, counted before anything is written.
// An item is a log (in a books file, keyed by _id), or an entry of any other file, keyed by its id, tag, name or key.

export type PreviewCounts = { toAdd: number; alreadyHere: number; differs: number }
export type ArchivePreview = PreviewCounts & { logs: PreviewCounts; other: PreviewCounts }

const isBook = (path: string): boolean => /(^|\/)books\//.test(path)

const itemsOf = (content: any, path: string): Array<[string, any]> => {
  if (Array.isArray(content)) {
    return content.map((item: any, i: number) => {
      const key = isBook(path) ? item?._id : item?.id ?? item?.tag ?? item?._id ?? item?.name
      return [`${key ?? `#${i}`}`, item]
    })
  }
  if (content && typeof content === 'object') return Object.entries(content)
  return []
}

const compare = (backup: Array<[string, any]>, existing: Map<string, any>): PreviewCounts => {
  let toAdd = 0
  let alreadyHere = 0
  let differs = 0
  for (const [key, item] of backup) {
    if (!existing.has(key)) {
      toAdd++
    } else if (JSON.stringify(existing.get(key)) === JSON.stringify(item)) {
      alreadyHere++
    } else {
      differs++
    }
  }
  return { toAdd, alreadyHere, differs }
}

/** Counts for the whole archive. `existingFor` gives what is on the device for a path (undefined when nothing is). */
export const previewArchive = (files: { [path: string]: any }, existingFor: (path: string) => any): ArchivePreview => {
  const logs: PreviewCounts = { toAdd: 0, alreadyHere: 0, differs: 0 }
  const other: PreviewCounts = { toAdd: 0, alreadyHere: 0, differs: 0 }
  for (const path of Object.keys(files)) {
    const existing = new Map(itemsOf(existingFor(path), path))
    const counts = compare(itemsOf(files[path], path), existing)
    const target = isBook(path) ? logs : other
    target.toAdd += counts.toAdd
    target.alreadyHere += counts.alreadyHere
    target.differs += counts.differs
  }
  return {
    toAdd: logs.toAdd + other.toAdd,
    alreadyHere: logs.alreadyHere + other.alreadyHere,
    differs: logs.differs + other.differs,
    logs,
    other,
  }
}
