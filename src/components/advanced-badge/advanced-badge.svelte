<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from '../icon/ion-icon.svelte'
  import { CrownOutline } from '../icon/nicons'
  import { Lang } from '../../store/lang'

  // low moves the badge down, for round icons whose top edge is cut off
  const { low = false } = $props<{ low?: boolean }>()
</script>

<!-- iOS look: a small grey badge with a gold crown marks a setting that only shows in Full mode.
     Grey and gold, not red, so it doesn't read as an unread count. -->
<span
  class="advanced-badge"
  class:low
  title={Lang.t('ui.full-mode-setting', 'Full mode setting')}
  aria-label={Lang.t('ui.full-mode-setting', 'Full mode setting')}
>
  <IonIcon icon={CrownOutline} size={10} />
</span>

<style>
  .advanced-badge.low {
    top: 12px;
  }
  /* Other rules size every svg in a nav item or list (for example h-5 w-5), which made the crown bigger than its circle */
  .advanced-badge :global(svg) {
    width: 10px !important;
    height: 10px !important;
  }
  /* The sidebar gives every icon a right margin (mr-4), which pushed the crown off the centre of its circle */
  .advanced-badge :global(.ion-icon) {
    margin: 0 !important;
  }
  .advanced-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 8px;
    background: var(--ios-label2);
    color: var(--ios-star);
    box-shadow: 0 0 0 2px var(--ios-card);
    line-height: 1;
  }
</style>
