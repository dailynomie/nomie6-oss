import { beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'

describe('recent emojis', () => {
  let store: Map<string, string>

  beforeEach(() => {
    vi.resetModules()
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (store.has(k) ? store.get(k) : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    })
  })

  it('puts the newest first, without duplicates, and keeps at most max entries', async () => {
    const { RecentEmojiStore, addRecentEmoji } = await import('./recent-emojis')
    addRecentEmoji({ e: '😀' }, 3)
    addRecentEmoji({ e: '🎉' }, 3)
    addRecentEmoji({ e: '😀' }, 3)
    addRecentEmoji({ e: '🌞' }, 3)
    addRecentEmoji({ e: '🍹' }, 3)
    expect(get(RecentEmojiStore).map((x) => x.e)).toEqual(['🍹', '🌞', '😀'])
  })

  it('saves under the existing key, so the list survives a reload', async () => {
    const { addRecentEmoji } = await import('./recent-emojis')
    addRecentEmoji({ e: '🎉' }, 5)
    expect(JSON.parse(store.get('recent-emojis') || '[]')).toEqual([{ e: '🎉' }])
    vi.resetModules()
    const reloaded = await import('./recent-emojis')
    expect(get(reloaded.RecentEmojiStore).map((x) => x.e)).toEqual(['🎉'])
  })

  it('starts empty when the saved value is not valid', async () => {
    store.set('recent-emojis', '{not json')
    const { RecentEmojiStore } = await import('./recent-emojis')
    expect(get(RecentEmojiStore)).toEqual([])
  })
})
