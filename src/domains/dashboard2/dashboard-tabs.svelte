<svelte:options runes={true} />

<script lang="ts">
  import HScroller from '../../components/h-scroller/h-scroller.svelte'
  import { DashStore, selectDashboardByIndex } from './DashStore'
</script>

<HScroller
  centerIfPossible
  activeIndex={$DashStore.activeIndex}
  className="n-dashboard-tabs filler"
  wrapperClass="space-x-4"
>
  {#each $DashStore.dashboards || [] as board, i (board.id)}
    <button
      class="tab board-{board.id} whitespace-nowrap truncate-1 {i == $DashStore.activeIndex
        ? 'selected'
        : 'inactive opacity-80'}"
      on:click={() => {
        selectDashboardByIndex(i)
      }}
    >
      {board.label}
    </button>
  {/each}
</HScroller>

<style lang="postcss" global>
  .n-dashboard-tabs {
    @apply h-12;
  }
  /* iOS look: dashboard names are capsules, like the board tabs on Track */
  .n-dashboard-tabs button {
    @apply transform transition-all duration-200;
    @apply whitespace-nowrap;
    height: 34px;
    padding: 0 16px;
    border-radius: 17px;
    font-size: 15px;
    font-weight: 500;
    background: var(--ios-fill);
    color: var(--ios-label);
  }
  /* iOS look: start at the left edge and scroll, instead of centring */
  .n-dashboard-tabs,
  .n-dashboard-tabs .wrapper,
  .n-dashboard-tabs .wrapper.force-center {
    justify-content: flex-start !important;
    margin-right: auto;
  }
  .n-dashboard-tabs .selected {
    background: var(--ios-tint);
    color: var(--ios-on-tint);
    font-weight: 600;
  }
</style>
