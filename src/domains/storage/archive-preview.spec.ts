import { describe, it, expect } from 'vitest'
import { previewArchive } from './archive-preview'

describe('previewArchive', () => {
  it('counts logs to add, logs already there, and logs that differ', () => {
    const backup = { 'data/books/2026-10-2': [{ _id: 'a', note: 'one' }, { _id: 'b', note: 'two' }, { _id: 'c', note: 'new' }] }
    const device = { 'data/books/2026-10-2': [{ _id: 'a', note: 'one' }, { _id: 'b', note: 'edited' }] }
    const preview = previewArchive(backup, (path) => device[path as keyof typeof device])
    expect(preview.logs).toEqual({ toAdd: 1, alreadyHere: 1, differs: 1 })
    expect(preview.other).toEqual({ toAdd: 0, alreadyHere: 0, differs: 0 })
  })

  it('counts entries of other files by their key', () => {
    const backup = { 'trackers.json': { coffee: { tag: 'coffee', label: 'Coffee' }, mood: { tag: 'mood', label: 'Mood' } } }
    const device = { 'trackers.json': { coffee: { tag: 'coffee', label: 'Coffee' } } }
    const preview = previewArchive(backup, (path) => device[path as keyof typeof device])
    expect(preview.other).toEqual({ toAdd: 1, alreadyHere: 1, differs: 0 })
  })

  it('treats a file the device does not have as all new', () => {
    const preview = previewArchive({ 'awards.json': [{ id: 'x' }, { id: 'y' }] }, () => undefined)
    expect(preview.toAdd).toBe(2)
    expect(preview.alreadyHere).toBe(0)
  })
})
