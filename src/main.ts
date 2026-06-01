// Polyfills for Node 16 compatibility
if (typeof globalThis !== 'undefined' && !globalThis.structuredClone) {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(predicate: any, thisArg?: any) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}
if (!Array.prototype.at) {
  Array.prototype.at = function(index: any) {
    const len = this.length >>> 0;
    const relativeIndex = Math.trunc(index) || 0;
    const actualIndex = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
    if (actualIndex < 0 || actualIndex >= len) {
      return undefined;
    }
    return this[actualIndex];
  };
}

//@ts-ignore
import NomieApp from './App.svelte'
import { useRegisterSW } from 'virtual:pwa-register/svelte'

const intervalMS = 60 * 60 * 1000

/* It's registering a service worker and then updating it every hour. */
useRegisterSW({
  onRegistered(r) {
    if (r) r.update()
    r &&
      setInterval(() => {
        r.update()
      }, intervalMS)
  },
})

/**
 * Setup Day JS
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
import weekOfYear from 'dayjs/plugin/weekOfYear'
dayjs.extend(weekOfYear)
import advancedFormat from 'dayjs/plugin/advancedFormat'
dayjs.extend(advancedFormat)
import dayOfYear from 'dayjs/plugin/dayOfYear'
dayjs.extend(dayOfYear)
import isoWeek from 'dayjs/plugin/isoWeek'
dayjs.extend(isoWeek)

const app = new NomieApp({
  target: document.body,
})

export default app
