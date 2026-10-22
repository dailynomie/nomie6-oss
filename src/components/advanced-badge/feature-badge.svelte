<svelte:options runes={true} />

<script lang="ts">
  import AdvancedBadge from './advanced-badge.svelte'
  // guardrail-ok: CMP-02 the crown rule (CROWN-02) is one pure function over the Starter lists in experience.ts
  import { isFullOnlyItem, type FeatureId } from '../../domains/preferences/experience'

  // The crown follows the Starter lists in experience.ts: an item is a Full-mode item when its feature is in
  // STARTER_HIDDEN, or its widget type is not in STARTER_WIDGET_TYPES. Change a list and the crown follows.
  const {
    feature = undefined,
    widgetType = undefined,
    low = false,
  } = $props<{
    feature?: FeatureId | string
    widgetType?: string
    low?: boolean
  }>()

  const fullOnly = $derived(isFullOnlyItem({ feature, widgetType }))
</script>

{#if fullOnly}
  <AdvancedBadge {low} />
{/if}
