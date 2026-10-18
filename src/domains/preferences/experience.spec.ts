import { describe, expect, it } from 'vitest'
import {
  isFeatureVisible,
  shouldOfferStarterNudge,
  isWidgetTypeVisible,
  resolveExperience,
  STARTER_HIDDEN,
  STARTER_WIDGET_TYPES,
  type FeatureId,
} from './experience'

const ALL_FEATURES: Array<FeatureId> = [
  'analytics',
  'blockly',
  'afternomie',
  'plugins',
  'ai',
  'files',
  'uoms',
  'csv',
  'advanced-tracker-options',
  'advanced-widgets',
  'people-board',
  'context-board',
  'experiment-advanced',
]

describe('resolveExperience', () => {
  it('gives a new user starter mode', () => {
    expect(resolveExperience({})).toBe('starter')
  })

  it('gives an existing, onboarded user full mode without any change', () => {
    expect(resolveExperience({ onboarded: true })).toBe('full')
  })

  it('always uses an explicit value', () => {
    expect(resolveExperience({ onboarded: true, experience: 'starter' })).toBe('starter')
    expect(resolveExperience({ onboarded: false, experience: 'full' })).toBe('full')
  })

  it('treats missing preferences as starter', () => {
    expect(resolveExperience(undefined)).toBe('starter')
  })
})

describe('isFeatureVisible', () => {
  it('shows every feature in full mode', () => {
    ALL_FEATURES.forEach((id) => expect(isFeatureVisible({ experience: 'full' }, id)).toBe(true))
  })

  it('hides exactly the STARTER_HIDDEN features in starter mode', () => {
    ALL_FEATURES.forEach((id) => {
      expect(isFeatureVisible({ experience: 'starter' }, id)).toBe(!STARTER_HIDDEN.includes(id))
    })
  })

  it('hides the starter-hidden features for a new user', () => {
    expect(isFeatureVisible({}, 'analytics')).toBe(false)
  })
})

describe('isWidgetTypeVisible', () => {
  it('shows every widget type in full mode', () => {
    expect(isWidgetTypeVisible({ experience: 'full' }, 'pointer')).toBe(true)
    expect(isWidgetTypeVisible({ experience: 'full' }, 'insight')).toBe(true)
  })

  it('shows only the starter widget types in starter mode', () => {
    STARTER_WIDGET_TYPES.forEach((id) => expect(isWidgetTypeVisible({ experience: 'starter' }, id)).toBe(true))
    expect(isWidgetTypeVisible({ experience: 'starter' }, 'pointer')).toBe(false)
    expect(isWidgetTypeVisible({ experience: 'starter' }, 'insight')).toBe(false)
    expect(isWidgetTypeVisible({ experience: 'starter' }, 'plugin')).toBe(false)
  })
})

describe('shouldOfferStarterNudge', () => {
  it('offers after 14 logged days in starter mode', () => {
    expect(shouldOfferStarterNudge({ experience: 'starter' }, 3, 14)).toBe(true)
    expect(shouldOfferStarterNudge({ experience: 'starter' }, 3, 13)).toBe(false)
  })

  it('offers after 30 launches in starter mode', () => {
    expect(shouldOfferStarterNudge({ experience: 'starter' }, 30, 0)).toBe(true)
    expect(shouldOfferStarterNudge({ experience: 'starter' }, 29, 0)).toBe(false)
  })

  it('never offers in full mode, or once it has been shown', () => {
    expect(shouldOfferStarterNudge({ experience: 'full' }, 40, 20)).toBe(false)
    expect(shouldOfferStarterNudge({ onboarded: true }, 40, 20)).toBe(false)
    expect(shouldOfferStarterNudge({ experience: 'starter', starterNudgeShown: true }, 40, 20)).toBe(false)
  })
})
