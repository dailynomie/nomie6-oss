<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from '../icon/ion-icon.svelte'
  import { CrownOutline } from '../icon/nicons'
</script>

<!-- iOS look: a small grey badge with a gold crown marks a setting that only shows in Full mode.
     Grey and gold, not red, so it doesn't read as an unread count. -->
<span class="advanced-badge" title="Full mode setting" aria-label="Full mode setting">
  <IonIcon icon={CrownOutline} size={10} />
</span>

<style>
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
    background: #636366;
    color: #f5c542;
    box-shadow: 0 0 0 2px var(--ios-card);
    line-height: 1;
  }
</style>
