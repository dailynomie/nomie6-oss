import type { PreferencesStateType } from './Preferences'

/**
 * Starter mode shows the core and keeps everything else one switch away.
 * It only hides navigation, options and entry points. It never deletes or hides data.
 */
export type ExperienceMode = 'starter' | 'full'

export type FeatureId =
  | 'analytics'
  | 'blockly'
  | 'afternomie'
  | 'plugins'
  | 'ai'
  | 'files'
  | 'uoms'
  | 'csv'
  | 'advanced-tracker-options'
  | 'advanced-widgets'
  | 'pointers'
  | 'people-board'
  | 'context-board'
  | 'experiment-advanced'

/** Everything a starter does not see by default. Deciding what starters see means changing this list. */
export const STARTER_HIDDEN: ReadonlyArray<FeatureId> = [
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
  'pointers',
  'people-board',
  'context-board',
  'experiment-advanced',
]

/** The widget types a starter can add. Pointers, plugins and AI insights are full-mode only. */
export const STARTER_WIDGET_TYPES: ReadonlyArray<string> = [
  'value',
  'barchart',
  'linechart',
  'habit',
  'text',
  'positivity',
  'experiment',
]

/**
 * Saved preferences replace the defaults, so older users have no `experience` field.
 * Existing users (already onboarded) keep the full app. New users start in starter mode.
 */
export const resolveExperience = (prefs: Partial<PreferencesStateType> | undefined): ExperienceMode =>
  prefs?.experience ?? (prefs?.onboarded ? 'full' : 'starter')

export const isFeatureVisible = (prefs: Partial<PreferencesStateType> | undefined, id: FeatureId): boolean =>
  resolveExperience(prefs) === 'full' || !STARTER_HIDDEN.includes(id)

/**
 * An item carries the crown when a Starter does not get it: its feature is in STARTER_HIDDEN,
 * or its widget type is not in STARTER_WIDGET_TYPES. The lists are the only source.
 */
export const isFullOnlyItem = (item: { feature?: string; widgetType?: string }): boolean => {
  if (item.feature !== undefined) return (STARTER_HIDDEN as ReadonlyArray<string>).includes(item.feature)
  if (item.widgetType !== undefined) return !STARTER_WIDGET_TYPES.includes(item.widgetType)
  return false
}

export const isWidgetTypeVisible = (prefs: Partial<PreferencesStateType> | undefined, widgetTypeId: string): boolean =>
  resolveExperience(prefs) === 'full' || STARTER_WIDGET_TYPES.includes(widgetTypeId)

export const STARTER_NUDGE_DAYS = 14
export const STARTER_NUDGE_LAUNCHES = 30

/** Offer full mode once: after 14 days with a log, or 30 launches, while still in starter mode. */
export const shouldOfferStarterNudge = (
  prefs: Partial<PreferencesStateType> | undefined,
  launches: number,
  loggedDays: number
): boolean =>
  resolveExperience(prefs) === 'starter' &&
  !prefs?.starterNudgeShown &&
  (loggedDays >= STARTER_NUDGE_DAYS || launches >= STARTER_NUDGE_LAUNCHES)
