import { writable } from 'svelte/store'
import { DEVICE_KEYS, getDeviceSetting, setDeviceSetting } from './device-settings'

/**
 * The emojis the user picked most recently. They are kept on this device only.
 */
const readRecent = (): Array<any> => {
  try {
    const saved = JSON.parse(getDeviceSetting(DEVICE_KEYS.recentEmojis) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch (e) {
    console.warn('Recent emojis could not be read', e)
    return []
  }
}

export const RecentEmojiStore = writable<Array<any>>(readRecent())

/**
 * Put an emoji at the top of the recent list, without duplicates, and keep at most `max` entries.
 */
export const addRecentEmoji = (emoji: any, max: number): void => {
  RecentEmojiStore.update((recent) => {
    const next = [emoji, ...recent.filter((item) => item.e !== emoji.e)].slice(0, max)
    setDeviceSetting(DEVICE_KEYS.recentEmojis, JSON.stringify(next))
    return next
  })
}
