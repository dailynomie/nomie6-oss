<svelte:options runes={true} />

<script lang="ts">
  import type { Trackable } from '../../trackable/Trackable.class'
  import type { TrackableUsage } from '../../usage/trackable-usage.class'
  import { Lang } from '../../../store/lang'

  const { trackable, usage } = $props()
</script>

<div class="stats2-card overview overview-timer">{Lang.t('stats.i-m-a-range-over-view', "I'm a Range Over View!")}</div>
