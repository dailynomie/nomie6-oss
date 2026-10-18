<svelte:options runes={true} />

<script lang="ts">
  // running: blue, positive: green (clear change as hoped), possible: amber (a hint), neutral: grey
  type ChipTone = 'running' | 'positive' | 'possible' | 'neutral'
  const { tone = 'neutral', label = '', title = undefined }: { tone?: ChipTone; label: string; title?: string } = $props()

  const classes: Record<ChipTone, string> = {
    running: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    possible: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  }
</script>

<span class="inline-block max-w-full truncate text-xs leading-tight rounded-full px-2 py-0.5 {classes[tone]}" {title}>{label}</span>
