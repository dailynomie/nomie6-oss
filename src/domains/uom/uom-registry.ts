import type { IUOM, UOMElement, UOMGroupingTypes } from './uom-types'
import UOMS from './uom.config'

/**
 * A unit the user made. It is stored as data (no functions), so the display
 * formatter is built from these fields when the registry is updated.
 */
export type CustomUomItem = {
  key: string
  singular: string
  plural: string
  symbol: string
  type: UOMGroupingTypes
  symbolAffix: 'pre' | 'post'
  symbolSpace: boolean
}

// Time and timer units are not offered: they have their own tracker types and behaviour.
export const CUSTOM_UOM_TYPES: Array<{ value: UOMGroupingTypes; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'currency', label: 'Currency' },
  { value: 'distance', label: 'Distance' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'health', label: 'Health' },
]

export const CUSTOM_UOM_KEY_PREFIX = 'custom-'

let customItems: Array<CustomUomItem> = []
let customUnits: IUOM = {}

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key)

// Thousands separators on the whole part only, so 1234.5 becomes 1,234.5
const withThousands = (value: number): string => {
  const [whole, fraction] = String(value).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

/**
 * Format a value for a custom unit. The symbol goes before or after the number,
 * with a space only when the unit asks for one. No symbol means the bare number.
 */
export const formatCustomUom = (value: any, item: CustomUomItem, include: boolean = true): string => {
  const number = Number(value)
  if (isNaN(number)) return `${value}`
  const text = withThousands(number)
  if (!item.symbol || include === false) return text
  const space = item.symbolSpace ? ' ' : ''
  return item.symbolAffix === 'pre' ? `${item.symbol}${space}${text}` : `${text}${space}${item.symbol}`
}

/**
 * Turn a stored custom unit into the same shape as a built-in unit, so the
 * rest of the app can use both the same way.
 */
export const toUomElement = (item: CustomUomItem): UOMElement => ({
  key: item.key,
  singular: item.singular,
  plural: item.plural,
  symbol: item.symbol,
  type: item.type,
  symbolAffix: item.symbolAffix,
  symbolSpace: item.symbolSpace,
  custom: true,
  display: (value: any, include?: boolean) => formatCustomUom(value, item, include),
})

/**
 * Replace the custom units the app knows about. Called whenever the custom unit store changes.
 */
export const setCustomUoms = (items: Array<CustomUomItem>) => {
  customItems = items
  customUnits = {}
  items.forEach((item) => {
    customUnits[item.key] = toUomElement(item)
  })
}

export const getCustomUoms = (): Array<CustomUomItem> => customItems

/**
 * Find a unit by key. Custom units are checked first, then the built-in ones.
 */
export const lookupUom = (key: string): UOMElement | undefined => {
  if (hasOwn(customUnits, key)) return customUnits[key]
  if (hasOwn(UOMS, key)) return UOMS[key]
  return undefined
}

/**
 * Every unit, built-in and custom, keyed by its key.
 */
export const allUoms = (): IUOM => {
  return { ...UOMS, ...customUnits }
}

/**
 * Returns the name of an existing unit that uses the same singular or plural name
 * (ignoring case), or undefined. The unit being edited is skipped by its key.
 */
export const findUomNameClash = (singular: string, plural: string, ignoreKey?: string): string | undefined => {
  const wanted = [singular, plural].map((name) => name.trim().toLowerCase())
  const others = Object.values(allUoms()).filter((uom) => uom.key !== ignoreKey)
  const clash = others.find((uom) => {
    const names = [uom.singular, uom.plural].map((name) => (name || '').trim().toLowerCase())
    return wanted.some((name) => name && names.includes(name))
  })
  return clash ? clash.plural || clash.singular : undefined
}

/**
 * A new key for a custom unit. It only has to be unique, the name is not part of it.
 */
export const newCustomUomKey = (): string => `${CUSTOM_UOM_KEY_PREFIX}${Date.now().toString(36)}`
