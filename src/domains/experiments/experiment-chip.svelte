<svelte:options runes={true} />

<script lang="ts">
  // running: blue, positive: green (clear change as hoped), possible: amber (a hint), neutral: grey
  type ChipTone = 'running' | 'positive' | 'possible' | 'neutral'
  const {
    tone = 'neutral',
    label = '',
    title = undefined,
  }: { tone?: ChipTone; label: string; title?: string } = $props()

  const classes: Record<ChipTone, string> = {
    running: 'chip-running',
    positive: 'chip-positive',
    possible: 'chip-possible',
    neutral: 'chip-neutral',
  }
</script>

<span class="chip {classes[tone]}" {title}>{label}</span>

<style>
  /* iOS look: chip colours from the design guide, section 2.1 */
  .chip {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 10px;
  }
  .chip-running {
    background: var(--ios-tint-soft);
    color: var(--ios-tint);
  }
  .chip-positive {
    background: var(--ios-good-soft);
    color: var(--ios-good);
  }
  .chip-possible {
    background: #fdf0d5; /* guardrail-ok: UI-07 the amber state has no token; light and dark values kept */
    color: #7a4d00; /* guardrail-ok: UI-07 the amber state has no token; light and dark values kept */
  }
  .chip-neutral {
    background: var(--ios-fill);
    color: var(--ios-label2);
  }
  :global(html.dark) .chip-possible {
    background: #3a2a06; /* guardrail-ok: UI-07 the amber state has no token; light and dark values kept */
    color: #ffd60a; /* guardrail-ok: UI-07 the amber state has no token; light and dark values kept */
  }
</style>
