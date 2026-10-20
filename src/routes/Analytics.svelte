<svelte:options runes={true} />

<script lang="ts">

  import Layout from '../domains/layout/layout.svelte'

  import AnalyticsView from '../domains/analytics/analytics-view.svelte'


  
</script>

<Layout pageTitle="My Analytics">
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