import { writable } from 'svelte/store'
import { parseNumber } from '../../utils/parseNumber/parseNumber'
import { DEVICE_KEYS, getDeviceSetting, setDeviceSetting } from '../../store/device-settings'

const launchCount: number = parseNumber(getDeviceSetting(DEVICE_KEYS.launchCount) || '1')
export const LaunchCount = writable(launchCount)

export const trackLaunch = () => {
  setDeviceSetting(DEVICE_KEYS.launchCount, `${launchCount + 1}`)
}
