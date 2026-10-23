import { describe, expect, test, afterEach } from 'vitest'
import {
  CUSTOM_UOM_KEY_PREFIX,
  findUomNameClash,
  formatCustomUom,
  lookupUom,
  newCustomUomKey,
  setCustomUoms,
  type CustomUomItem,
} from './uom-registry'
import { getGroupedUoms, uomFormat, uomPlural, uomSymbol } from './uom-utils'
import uom from './uom'

const bottle: CustomUomItem = {
  key: 'custom-bottle',
  singular: 'Bottle',
  plural: 'Bottles',
  symbol: '',
  type: 'general',
  symbolAffix: 'post',
  symbolSpace: false,
}

const millilitre: CustomUomItem = {
  key: 'custom-ml',
  singular: 'Shot',
  plural: 'Shots',
  symbol: 'shots',
  type: 'volume',
  symbolAffix: 'post',
  symbolSpace: true,
}

const coin: CustomUomItem = {
  key: 'custom-coin',
  singular: 'Token',
  plural: 'Tokens',
  symbol: 'T',
  type: 'currency',
  symbolAffix: 'pre',
  symbolSpace: false,
}

afterEach(() => {
  setCustomUoms([])
})

describe('formatCustomUom', () => {
  test('puts the symbol after the number, with a space only when asked', () => {
    expect(formatCustomUom(12, millilitre)).toBe('12 shots')
    expect(formatCustomUom(12, { ...millilitre, symbolSpace: false })).toBe('12shots')
  })

  test('puts the symbol before the number when asked', () => {
    expect(formatCustomUom(12, coin)).toBe('T12')
    expect(formatCustomUom(12, { ...coin, symbolSpace: true })).toBe('T 12')
  })

  test('shows the bare number when there is no symbol', () => {
    expect(formatCustomUom(7, bottle)).toBe('7')
  })

  test('groups thousands and keeps decimals', () => {
    expect(formatCustomUom(1234567, bottle)).toBe('1,234,567')
    expect(formatCustomUom(-1000, bottle)).toBe('-1,000')
    expect(formatCustomUom(1234.5, bottle)).toBe('1,234.5')
  })

  test('leaves the symbol out when include is false', () => {
    expect(formatCustomUom(12, millilitre, false)).toBe('12')
  })
})

describe('registry lookup', () => {
  test('a custom unit is found and formats through the app helpers', () => {
    expect(lookupUom('custom-coin')).toBeUndefined()
    setCustomUoms([coin])
    expect(lookupUom('custom-coin')?.custom).toBe(true)
    expect(uomFormat(12, 'custom-coin')).toBe('T12')
    expect(uomPlural('custom-coin')).toBe('Tokens')
    expect(uomSymbol('custom-coin')).toBe('T')
    expect(uom.format(1000, 'custom-coin')).toBe('T1,000')
  })

  test('built-in units are still found', () => {
    setCustomUoms([bottle])
    expect(lookupUom('dollars')?.custom).toBeUndefined()
    expect(uomFormat(10, 'dollars')).toBe('$10.00')
  })

  test('a removed custom unit is no longer found', () => {
    setCustomUoms([bottle])
    setCustomUoms([])
    expect(lookupUom('custom-bottle')).toBeUndefined()
  })
})

describe('grouped units', () => {
  test('custom units are listed under their category, next to the built-in ones', () => {
    const groups = getGroupedUoms(true, [millilitre, bottle])
    const volume = groups.volume.map((u) => u.key)
    expect(volume).toContain('cup')
    expect(volume).toContain('custom-ml')
    expect(groups.general.map((u) => u.key)).toContain('custom-bottle')
    expect(groups.volume.find((u) => u.key === 'custom-ml')?.custom).toBe(true)
    expect(groups.volume.find((u) => u.key === 'cup')?.custom).toBeUndefined()
  })

  test('the passed list decides which custom units are shown', () => {
    setCustomUoms([bottle])
    const groups = getGroupedUoms(true, [])
    expect(groups.general.map((u) => u.key)).not.toContain('custom-bottle')
  })
})

describe('name clashes', () => {
  test('a name used by a built-in unit is a clash, ignoring case', () => {
    expect(findUomNameClash('dollar', 'dollars')).toBeDefined()
  })

  test('a unit does not clash with itself when editing', () => {
    setCustomUoms([millilitre])
    expect(findUomNameClash('Shot', 'Shots')).toBeDefined()
    expect(findUomNameClash('Shot', 'Shots', 'custom-ml')).toBeUndefined()
  })

  test('a new name is free', () => {
    expect(findUomNameClash('Scoop', 'Scoops')).toBeUndefined()
  })
})

describe('new keys', () => {
  test('a new key has the custom prefix and is unique', () => {
    const first = newCustomUomKey()
    expect(first.startsWith(CUSTOM_UOM_KEY_PREFIX)).toBe(true)
    expect(lookupUom(first)).toBeUndefined()
  })
})
