<svelte:options runes={true} />

<script lang="ts">
  import { Link } from '../../vendor/svelte-navigator'
  import Button from '../button/button.svelte'

  const { label, id, link, className, notify } = $props()
</script>

<Button className="tab-wrap tab-{id} {className}" ariaLabel={label}>
  <Link to={link}>
    {#if notify}
      <div class="notify">{notify}</div>
    {/if}
    <slot />
    <div class="label whitespace-nowrap">{label}</div>
  </Link>
</Button>

<style global lang="postcss">
  .tab-wrap {
    position: relative;
    display: flex;
    flex-grow: 1;
    height: 100%;
    align-items: center;
  }
  .tab-wrap a {
    position: relative;
    color: var(--ios-label2);
    @apply inline-flex  flex-col items-center justify-center;
    @apply relative;
    /* iOS look: the icon starts 6 px from the top of the 49 pt bar, the label keeps 4 px above the bottom */
    padding: 6px 10px 4px;
    justify-content: flex-start;
    font-size: 10px;
    line-height: 12px;
    font-weight: 500;
    gap: 2px;
    height: 100%;
    text-decoration: none;
    flex-grow: 1;
    flex-shrink: 1;
    transition: all 0.2s ease-in-out;
    min-width: 30px;
    width: 100%;
    @apply transition-all duration-200 ease-in-out;
  }
  .tab-wrap a i {
    pointer-events: none;
    font-size: 26px;
    transition: all 0.2s ease-in-out;
  }
  .tab-wrap a .label {
    pointer-events: none;
    margin-bottom: 0;
  }
  /* iOS look: regular tab bar symbols are 25 pt (Apple HIG, tab bars) */
  .tab-wrap a svg {
    width: 25px;
    height: 25px;
  }
  .tab-wrap a[aria-current='page'] {
    color: var(--ios-tint);
    font-weight: 600;
  }
  .tab-wrap a[aria-current='page'] svg {
    transition: all 0.2s ease-in-out;
  }
  .tab-wrap a[aria-current='page']:after {
    content: '';
  }
  /* iOS look: an unread count is the danger colour, with on-danger text (4.5:1) */
  .tab-wrap a .notify {
    background: var(--ios-danger);
  }
  .tab-wrap a[aria-current='page'] .notify {
    background: var(--ios-danger);
  }

  .tab-wrap a .notify {
    @apply absolute;
    @apply top-0;
    @apply z-40;
    color: var(--ios-on-danger);
    @apply font-semibold;
    font-size: 11px;
    @apply h-4 flex items-center justify-center;
    @apply px-1 py-1;
    @apply rounded-full;
    @apply left-1/2;
    @apply shadow-sm;
  }
  .tab-wrap a:active {
    @apply scale-95;
  }
</style>
