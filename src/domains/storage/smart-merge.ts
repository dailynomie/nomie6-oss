import mergeDeep from 'deepmerge'

/**
 * Smart Merge
 * Merges stored data (v1, what's on this device) with incoming data (v2, from a
 * backup or template). Scalars: incoming wins. Objects: merged deeply.
 * Arrays: merged without duplicates (see mergeArray) — never blindly concatenated,
 * so restoring or importing the same data twice is idempotent.
 */
export const smartMerge = (v1: any, v2: any): any => {
  if (v1 instanceof Array) {
    return mergeArray(v1, v2)
  } else {
    return deepMerge(v1, v2)
  }
}

// Keys that identify an item in a stored array. When an item has several,
// the last match wins (kept for compatibility with existing stored data).
const KEYS = ['_id', 'key', 'id', 'tag']

const isPlainObject = (item: any): boolean =>
  item !== null && typeof item === 'object' && !Array.isArray(item)

const fingerprint = (item: any): string => {
  try {
    return JSON.stringify(item)
  } catch (e) {
    return String(item)
  }
}

const deepMerge = (v1: any, v2: any): any => mergeDeep(v1, v2, { arrayMerge: (target, source) => mergeArray(target, source) })

/**
 * Merge two arrays without creating duplicates.
 * - Objects that share an id-like key are merged together (incoming wins on conflicts).
 * - Everything else (primitives, objects without an id) is kept once, compared by value.
 * - Order: existing items first, then new incoming items.
 */
const idKeyOf = (items: Array<any>): string | undefined => {
  const baseItem = items.find(isPlainObject)
  let id: string | undefined
  if (baseItem) {
    KEYS.forEach((idType) => {
      if (Object.prototype.hasOwnProperty.call(baseItem, idType)) id = idType
    })
  }
  return id
}

/**
 * Add only what is missing. Items that already exist (same id-like key) keep their
 * current version; new items are appended. Objects keep existing values and gain new keys.
 */
export const addMissing = (existing: any, incoming: any): any => {
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    const id = idKeyOf([...existing, ...incoming])
    const keyOf = (item: any) => (id !== undefined && isPlainObject(item) && item[id] != null ? `id:${item[id]}` : fingerprint(item))
    const known = new Set(existing.map(keyOf))
    return [...existing, ...incoming.filter((item) => !known.has(keyOf(item)))]
  }
  if (isPlainObject(existing) && isPlainObject(incoming)) {
    return { ...incoming, ...existing }
  }
  return existing
}

export const mergeArray = (v1: Array<any>, v2: Array<any>): Array<any> => {
  const existing = Array.isArray(v1) ? v1 : []
  const incoming = Array.isArray(v2) ? v2 : []
  if (!existing.length && !incoming.length) return []

  const id = idKeyOf([...existing, ...incoming])

  const order: Array<string> = []
  const groups: { [slot: string]: Array<any> } = {}

  ;[...existing, ...incoming].forEach((item) => {
    const itemId = id !== undefined && isPlainObject(item) ? item[id] : undefined
    const slot = itemId !== undefined && itemId !== null ? `id:${itemId}` : `value:${fingerprint(item)}`
    if (!groups[slot]) {
      groups[slot] = []
      order.push(slot)
    }
    groups[slot].push(item)
  })

  return order.map((slot) => {
    const items = groups[slot]
    if (items.length === 1 || slot.startsWith('value:')) return items[0]
    return items.reduce((merged, item) => deepMerge(merged, item))
  })
}
