<svelte:options runes={true} />

<script lang="ts">
  import ProgressBar from '../../components/progress-bar/progress-bar.svelte'

  // Share of the experiment days that have happened, 0 to 1. Drawn by the same bar as goals.
  const { value = 0, className = undefined }: { value?: number; className?: string } = $props()
  let percent = $derived(Math.round(Math.min(1, Math.max(0, value)) * 100))
</script>

<ProgressBar percentage={percent} className={className ?? 'ios-progress-track'} barClass="ios-progress-fill" />
