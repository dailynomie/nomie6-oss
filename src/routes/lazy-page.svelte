<svelte:options runes={true} />

<script lang="ts">
  import Spinner from '../components/spinner/spinner.svelte'
  import { Lang } from '../store/lang'

  // A page is loaded the first time its route is shown, so the first load of the app has only the start pages.
  const { load } = $props<{ load: () => Promise<any> }>()
  const page = load()
</script>

{#await page}
  <div class="flex h-full w-full items-center justify-center py-12">
    <Spinner size={26} />
  </div>
{:then mod}
  {@const Page = mod.default}
  <Page />
{:catch error}
  {@const logged = console.error('page failed to load', error)}
  <div class="p-6 text-center text-sm text-ios-label2">
    {Lang.t('ui.page-failed-to-load', 'This page could not be loaded. Reload the app to try again.')}
  </div>
{/await}
