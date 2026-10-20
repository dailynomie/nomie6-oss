<svelte:options runes={true} />

<script lang="ts">

  import Layout from '../domains/layout/layout.svelte'

  import AnalyticsView from '../domains/afternomie/afternomie-view.svelte'


  
</script>

<Layout pageTitle="AfterNomie" checkIn={false}>
  <div slot="header">
    <h1 class="ios-large-title">
      <span>AfterNomie</span>&nbsp;<span class="redText">BETA</span>
    </h1>
  </div>
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