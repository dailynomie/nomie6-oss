import { derived } from 'svelte/store'
import { Prefs } from './Preferences'
import { isFeatureVisible, isWidgetTypeVisible, type FeatureId } from './experience'

export * from './experience'

// Convenience store for components: $FeatureVisible('analytics')
export const FeatureVisible = derived(Prefs, ($p) => (id: FeatureId) => isFeatureVisible($p, id))

// Convenience store for the widget picker: $WidgetTypeVisible('pointers')
export const WidgetTypeVisible = derived(Prefs, ($p) => (id: string) => isWidgetTypeVisible($p, id))
