<svelte:options runes={true} />

<script lang="ts">
  // running: blue, positive: green (clear change as hoped), possible: amber (a hint), neutral: grey
  type ChipTone = 'running' | 'positive' | 'possible' | 'neutral'
  const { tone = 'neutral', label = '', title = undefined }: { tone?: ChipTone; label: string; title?: string } = $props()

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
    background: #e3effb;
    color: #0a5ba8;
  }
  .chip-positive {
    background: #ddf3e2;
    color: #1e6b30;
  }
  .chip-possible {
    background: #fdf0d5;
    color: #7a4d00;
  }
  .chip-neutral {
    background: #eeeef2;
    color: #55555a;
  }
  :global(html.dark) .chip-running {
    background: #0b2236;
    color: #7cc6ff;
  }
  :global(html.dark) .chip-positive {
    background: #123620;
    color: #5be07f;
  }
  :global(html.dark) .chip-possible {
    background: #3a2a06;
    color: #ffd60a;
  }
  :global(html.dark) .chip-neutral {
    background: #2c2c2e;
    color: #c7c7cc;
  }
</style>
