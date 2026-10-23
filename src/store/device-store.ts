/**
 * Commander
 * Partial port + cleanup from Nomie 2 - currently only supports Notes.
 * Nomie 2 supported all sorts of wacky shit
 */

import { Interact } from './interact'
// utils
import Logger from '../utils/log/log'
import clipboard from '../utils/clipboard/clipboard'
import { showToast } from '../components/toast/ToastStore'
// Svelte
import { writable } from 'svelte/store'
import { DEVICE_KEYS, getDeviceSetting, setDeviceSetting } from './device-settings'

// Vendors
const console = new Logger('📲 Device Store')

declare let window: any

export type DeviceSizeType = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const sizes = {
  xs: -1,
  sm: 0,
  md: 350,
  lg: 767,
  xl: 1280,
  '2xl': 1536,
}

// Nomie API Store

const DeviceInfo = {
  appName: navigator.appName,
  appCodeName: navigator.appCodeName,
  appVersion: navigator.appVersion,
  userAgent: navigator.userAgent,
  product: navigator.product,
}
const DeviceInfoString = JSON.stringify(DeviceInfo).toLowerCase()

const getDeviceSize = function (width: number) {
  if (width > sizes.xs && width < sizes.sm) {
    return 'xs'
  } else if (width > sizes.sm && width < sizes.md) {
    return 'sm'
  } else if (width > sizes.md && width < sizes.lg) {
    return 'md'
  } else if (width > sizes.lg && width < sizes.xl) {
    return 'lg'
  } else if (width > sizes.xl) {
    return 'xl'
  }
}

// Text size setting. Each value multiplies the base text size in main.css.
// The ratios come from the 6.x steps (0.94em to 1.4em, with md = 1.15em), so md is the default look.
const fontSizes: Record<string, number> = {
  xs: 0.82,
  sm: 0.85,
  md: 1,
  lg: 1.09,
  xl: 1.22,
}

// Sets the --font-setting variable on <html>. main.css turns it into --text-scale,
// which every text size uses, so the setting reaches all screens and components.
const applyFontSize = (size: string) => {
  document.documentElement.style.setProperty('--font-setting', `${fontSizes[size] || 1}`)
}

const DeviceStoreInit = () => {
  let deviceMatches = DeviceInfoString.match(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i)
  let device = deviceMatches ? deviceMatches[0] : 'browser'

  const baseState = {
    lastUrl: '',
    width: window.innerWidth,
    height: window.innerHeight,
    platform: navigator.platform,
    device: device,
    offline: !navigator.onLine,
    pwa: window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
    info: DeviceInfo,
    size: getDeviceSize(window.innerWidth),
    fontSize: getDeviceSetting(DEVICE_KEYS.fontSize) || 'md',
  }

  const { update, subscribe, set } = writable(baseState)

  applyFontSize(baseState.fontSize)
  ;(function state(s: any) {
    let _state
    update((state) => {
      _state = { ...state, ...s }
      return _state
    })
    return _state
  })

  const state = (updatedState: any) => {
    update((s: any) => {
      return { ...s, ...updatedState }
    })
  }

  const methods = {
    copy(key: string, message?: string) {
      clipboard(key)
      showToast({ message: message || 'Copied' })
    },
    tempURL(path: string, title: string = '') {
      update((s) => {
        s.lastUrl = document.location.pathname
        return s
      })
      window.history.pushState({}, title, path)
    },
    restoreURL() {
      update((s) => {
        let last = s.lastUrl
        window.history.pushState({}, 'Nomie', last)
        s.lastUrl = undefined
        return s
      })
    },
    isDesktop() {
      return document.body.scrollWidth >= 900
    },
    iOS() {
      if (/iPad|iPhone|iPod/.test(navigator.platform)) {
        return true
      } else {
        return navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)
      }
    },
    scrollToTop() {
      document.body.scrollTop = document.documentElement.scrollTop = 0
    },
    open(url) {
      window.open(`${url}`, '_blank')
    },
    isSmallerThan(size: DeviceSizeType) {
      return window.innerWidth < sizes[size]
    },
    isLargerThan(size: DeviceSizeType) {
      return window.innerWidth > sizes[size]
    },
    reload() {
      window.location.reload()
    },
    is(regex: string | RegExp) {
      if (typeof regex === 'string') {
        regex = new RegExp(regex, 'gi')
      }
      return DeviceInfoString.match(regex)
    },
    init() {
      const fireChange = () => {
        if (navigator.onLine) {
          document.body.classList.remove('is-offline')
          window.offline = false
          state({
            offline: false,
            width: window.innerWidth,
            size: getDeviceSize(window.innerWidth),
            height: window.innerHeight,
          })
        } else {
          document.body.classList.add('is-offline')
          window.offline = true
          state({
            offline: true,
            width: window.innerWidth,
            size: getDeviceSize(window.innerWidth),
            height: window.innerHeight,
          })
        }
      }
      window.addEventListener('online', fireChange)
      window.addEventListener('offline', fireChange)
      window.addEventListener('resize', fireChange)
      fireChange()
    },
  }

  return {
    subscribe,
    update,
    set,
    ...methods,
    info: DeviceInfo,
  }
}

export const Device = DeviceStoreInit()

export const setFontSize = (size: 'sm' | 'md' | 'lg' | 'xl' | 'xs' | string) => {
  setDeviceSetting(DEVICE_KEYS.fontSize, size)
  applyFontSize(size)
  Device.update((s) => {
    s.fontSize = size
    return s
  })
}
