<svelte:options runes={true} />

<script lang="ts">
  import Text from '../text/text.svelte'


  const { style, solo, transparent, className, title, disabled, id, outside, role } = $props()
</script>

{#if title && outside}
  <header>
    <div class="outside-title flex items-end lg:mt-4 mb-1 lg:mb-2">
      <h2 class="ios-section pl-1 font-semibold uppercase leading-tight">{title}</h2>
      <slot name="header-left" />
      <slot name="header-right" />
    </div>
    <slot name="subheader" />
  </header>
{/if}
<div
  {id}
  class="n-list {disabled ? 'disabled' : ''} {solo ? 'solo' : ''}
  {transparent ? 'transparent' : ''}
  {className}"
  {style}
  {role}
>
  {#if title && !outside}
    <div class="flex items-center justify-between">
      <Text size="xs" className="pt-3 px-3 pb-2 text-ios-label2" bold faded>
        {title.toUpperCase()}
      </Text>
      <slot name="header-left" />
    </div>
  {/if}
  <slot />
</div>
<slot name="bottom" />

<style global lang="postcss">
  .n-list.bright {
    @apply bg-ios-card;
  }
  .n-list {
    background: var(--ios-card);
    overflow: hidden;
    @apply relative;
  }

  .n-list > div > .n-input-container:first-child {
    border-top-left-radius: 12px; border-top-right-radius: 12px;
  }
  .n-list > div > .n-input-container:last-child {
    border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
  }

  .n-list .list-header {
    @apply bg-ios-card;
    @apply px-4 text-sm text-ios-label2;
    @apply h-7;
    @apply flex items-center;
  }

  .outside-title {
    padding: 22px 16px 7px;
    color: var(--ios-label);
    @apply flex items-center justify-between;
  }

  .n-list.disabled {
    @apply pointer-events-none;
  }

  .disabled {
    @apply opacity-60;
  }
  .n-list.disabled:after {
    content: '';
    @apply bg-ios-card bg-opacity-50 dark:bg-opacity-50;
    @apply absolute;
    @apply top-0 left-0 right-0 bottom-0;
  }
  .n-list.transparent,
  .n-list[transparent] {
    background-color: transparent;
  }
  .n-list.solo,
  .n-list [solo] {
    width: calc(100% - 16px);
    @apply mx-auto;
    box-shadow: none;
    border-radius: 12px;
    overflow: hidden;

    padding: 0px 0;
  }

  .n-list.solo > .n-input-container.list-item:first-child {
    border-top-left-radius: 12px; border-top-right-radius: 12px;
  }
  .n-list.solo > .n-input-container.list-item:last-child {
    border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
  }

  .n-list.solo.w-full {
    width:100%;
  }
  .n-list.solo .n-item:first-child {
    border-top-left-radius: 12px; border-top-right-radius: 12px;
  }

  .n-list.solo .n-item:last-child {
    border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
  }

  /* iOS look: section headings above lists are 13 px uppercase in the secondary label colour */
  .ios-section {
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.3px;
    color: var(--ios-label2);
  }

  .n-list.framed {
    /* border: solid 1px var(--color-solid-2) !important; */
  }
</style>
