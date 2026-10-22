<svelte:options runes={true} />

<script lang="ts">
  import Button from '../../components/button/button.svelte'
  import { FeatureVisible, type FeatureId } from './features'
  import { Prefs } from './Preferences'

  // Wraps a page that starter mode hides. A starter who opens it directly sees this instead.
  const { feature }: { feature: FeatureId } = $props()

  const switchToFull = () => {
    $Prefs.experience = 'full'
  }
</script>

{#if $FeatureVisible(feature)}
  <slot />
{:else}
  <div
    class="flex flex-col items-center justify-center h-full min-h-[60vh] px-8 py-12 text-center space-y-4 text-ios-label"
  >
    <div class="text-lg font-semibold">This is part of the full Daily Nomie</div>
    <div class="text-sm text-ios-label2 max-w-sm">
      Starter mode keeps the app simple. Switch to full mode to open it. Your data stays as it is.
    </div>
    <Button primary on:click={switchToFull}>Switch to full mode</Button>
  </div>
{/if}
