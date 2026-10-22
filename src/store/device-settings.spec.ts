import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_KEYS, getDeviceSetting, removeDeviceSetting, setDeviceSetting } from './device-settings'

// The key names are part of the stored data. Changing one would silently lose every user's value.
describe('device setting keys keep the strings the app has always used', () => {
  it('matches the stored key names', () => {
    expect(DEVICE_KEYS).toEqual({
      launchCount: 'launchCount',
      lastDashIndex: 'last-dash-index',
      lastBoard: 'last-known-board',
      lastBackupDate: 'last-backup-date',
      lastPluginCleanupDate: 'last-plugin-cleanup-date',
      lastPluginCleanupLog: 'last-plugin-cleanup-log',
      locationCache: 'loc-cache',
      fontSize: 'fontSize',
      language: 'n4-lang',
      pwaUpdateState: 'nomie_pwa_update_state',
      recentEmojis: 'recent-emojis',
    })
  })
})

describe('device settings access', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (store.has(k) ? store.get(k) : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    })
  })

  it('reads back what was saved, and null when nothing was saved', () => {
    expect(getDeviceSetting(DEVICE_KEYS.fontSize)).toBe(null)
    setDeviceSetting(DEVICE_KEYS.fontSize, 'lg')
    expect(getDeviceSetting(DEVICE_KEYS.fontSize)).toBe('lg')
    expect(store.get('fontSize')).toBe('lg')
  })

  it('removes a saved value', () => {
    setDeviceSetting(DEVICE_KEYS.lastBoard, 'main')
    removeDeviceSetting(DEVICE_KEYS.lastBoard)
    expect(getDeviceSetting(DEVICE_KEYS.lastBoard)).toBe(null)
  })

  it('does not throw when the browser refuses storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(getDeviceSetting(DEVICE_KEYS.launchCount)).toBe(null)
    expect(() => setDeviceSetting(DEVICE_KEYS.launchCount, '2')).not.toThrow()
    expect(() => removeDeviceSetting(DEVICE_KEYS.launchCount)).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
