import { describe, expect, test } from 'vitest'
import { removeTagFromNote } from './unknown-tag-text'

describe('removeTagFromNote', () => {
  test('removes a whole tag and keeps the rest of the note', () => {
    expect(removeTagFromNote('Slept well #walk after lunch', '#walk')).toBe('Slept well after lunch')
  })
  test('removes a tag at the start and at the end', () => {
    expect(removeTagFromNote('#walk slept well', '#walk')).toBe('slept well')
    expect(removeTagFromNote('slept well #walk', '#walk')).toBe('slept well')
  })
  test('keeps a longer tag that starts the same way', () => {
    expect(removeTagFromNote('a #walkdog walk #walk', '#walk')).toBe('a #walkdog walk')
  })
  test('removes a tag with a value', () => {
    expect(removeTagFromNote('ran #walk(3) km', '#walk')).toBe('ran km')
  })
  test('leaves a note without the tag unchanged', () => {
    expect(removeTagFromNote('no tags here', '#walk')).toBe('no tags here')
  })
})
