/**
 * Commander
 * Partial port + cleanup from Nomie 2 - currently only supports Notes.  Nomie 2 supported all sorts of wacky shit
 */

// Svelte
import { writable } from 'svelte/store'

// utils
import Logger from '../utils/log/log'

// Vendors
import i18next from 'i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/nl'
import 'dayjs/locale/de'
import 'dayjs/locale/it'
import 'dayjs/locale/zh-cn'

import langs from '../lang/lang'
import { DEVICE_KEYS, getDeviceSetting, setDeviceSetting } from './device-settings'
// import testLang from '../lang/test';

// Stores

const console = new Logger('🚦 Lang')

// dates and times follow the language; a language without a dayjs locale uses English
const DAYJS_LOCALES = { nl: 'nl', de: 'de', it: 'it', zhcn: 'zh-cn' }

// Nomie API Store

const LangInit = () => {
  let base = {
    lang: getDeviceSetting(DEVICE_KEYS.language) || 'en',
  }
  const { update, subscribe, set } = writable(base)
  dayjs.locale(DAYJS_LOCALES[base.lang] || 'en')

  // English is in the first load; the chosen language is added below, before any module that shows text is evaluated
  i18next.init({
    lng: 'en',
    fallbackLng: 'en',
    // the app is not HTML, so a value such as Tom & Jerry is shown as typed
    interpolation: { escapeValue: false },
    resources: {
      en: langs['en'].lang,
    },
  })

  const methods = {
    t(str: string, payload?: any) {
      return i18next.t(str, payload)
    },
    getLangs() {
      // the language in use is always listed, so a device set to an unfinished language can still see it
      const current = getDeviceSetting(DEVICE_KEYS.language) || 'en'
      return Object.keys(langs)
        .filter((key) => langs[key].shipped || key === current)
        .map((key) => {
          let lang = langs[key]
          lang.key = key
          return lang
        })
    },
    setLang(langKey) {
      update((d) => {
        d.lang = langKey
        return d
      })
      setDeviceSetting(DEVICE_KEYS.language, langKey)
      setTimeout(() => {
        // window.location.reload();
        window.location.href = '/'
      }, 10)
    },
  }

  return {
    update,
    subscribe,
    set,
    ...methods,
  }
}

export const Lang = LangInit()

// Top-level await: the chosen language is loaded before the modules that import this store are evaluated, so text read
// at start-up is translated too. If the language cannot be loaded, English is kept.
const chosenLanguage: string = getDeviceSetting(DEVICE_KEYS.language) || 'en'
const chosenEntry: any = langs[chosenLanguage]
if (chosenLanguage !== 'en' && chosenEntry && chosenEntry.load) {
  try {
    const mod = await chosenEntry.load()
    i18next.addResourceBundle(chosenLanguage, 'translation', mod.default.translation, true, true)
    await i18next.changeLanguage(chosenLanguage)
  } catch (e) {
    console.error('could not load the language, English is used', e)
  }
}
