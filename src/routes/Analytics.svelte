<svelte:options runes={true} />

<script lang="ts">

  import Layout from '../domains/layout/layout.svelte'

  import AnalyticsView from '../domains/analytics/analytics-view.svelte'


  
</script>

<Layout pageTitle="My Analytics">
  <!-- iOS look (3.1): large title with the BETA tag in tint; this is a top-level screen -->
  <header slot="header" class="glass px-4 pt-2 pb-3">
    <h1 class="text-ios-large font-bold text-ios-label mt-1">
      My Analytics <span class="text-ios-tint text-ios-title3 font-semibold align-middle">BETA</span>
    </h1>
  </header>
  <AnalyticsView />
</Layout>

<style>
  .redText
  {
      color:rgb(33, 147, 214);
  }
  .blackText
  {
      color:black;
      font-weight:bold;
  }
</style>