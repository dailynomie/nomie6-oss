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
    padding: 6px 10px;
    font-size: 10px;
    line-height: 12px;
    font-weight: 500;
    gap: 3px;
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
  .tab-wrap a svg {
    width: 26px;
    height: 26px;
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
  .tab-wrap a .notify {
    @apply bg-gray-600 dark:bg-gray-400;
  }
  .tab-wrap a[aria-current='page'] .notify {
    @apply bg-primary-500 dark:text-gray-800;
  }

  .tab-wrap a .notify {
    @apply absolute;
    @apply top-0;
    @apply z-40;
    @apply text-white dark:text-gray-800;
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
