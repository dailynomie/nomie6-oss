<svelte:options runes={true} />

<script lang="ts">
  // The markdown renderer (with its parser) is loaded the first time a message is shown. Until then, the plain text is shown.
  const { content } = $props<{ content: string }>()
  const renderer = import('./markdown.svelte')
</script>

{#await renderer}
  {content}
{:then mod}
  {@const Markdown = mod.default}
  <Markdown {content} />
{:catch}
  {content}
{/await}
