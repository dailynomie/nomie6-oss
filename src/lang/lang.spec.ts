import { describe, it, expect } from 'vitest'
import langs from './lang'

// F6: for 7.0 the picker offers the languages that are complete. The others are kept and hidden until they are.
describe('language picker', () => {
  it('ships English and Dutch only', () => {
    const shipped = Object.keys(langs).filter((key) => (langs as any)[key].shipped)
    expect(shipped.sort()).toEqual(['en', 'nl'])
  })
})
