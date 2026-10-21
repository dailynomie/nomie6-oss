<svelte:options runes={true} />

<script lang="ts">
  import Toolbar from '../toolbar/toolbar.svelte'
  import Text from '../text/text.svelte'


  const { className, style, title, pad, compact, shadow, bodyClass } = $props()
</script>

<div class="n-card {className} {pad ? 'p-3' : ''} {compact ? 'comapct' : ''} {!shadow ? 'box-shadow-off' : ''}" {style}>
  {#if title || $$slots['header']}
    <Toolbar className="justify-between stiff h-10">
      <div class="flex-grow w-full">
        <Text className="title {pad ? 'pb-3' : 'p-3'}" bold>{title}</Text>
      </div>
      <slot name="header" />
    </Toolbar>
  {/if}
  <div class="n-card-body h-full relative {bodyClass}"><slot /></div>
</div>

<style global>
  .n-card {
    @apply relative;
    @apply bg-ios-card;
    @apply shadow-md;
    @apply flex flex-col;
    /* iOS look: the same 12 px radius as the grouped lists */
    @apply rounded-xl;
    @apply overflow-auto;
    @apply text-ios-label;
  }
  .n-card.compact .title {
    font-size: 0.7em;
  }
</style>
