<svelte:options runes={true} />

<script lang="ts">
  import Layout from '../domains/layout/layout.svelte'

  import AnalyticsView from '../domains/afternomie/afternomie-view.svelte'
  import ToolbarGrid from '../components/toolbar/toolbar-grid.svelte'
  import NBackButton from '../components/back-button/back-button.svelte'
  import { Lang } from '../store/lang'
</script>

<Layout pageTitle="AfterNomie" checkIn={false}>
  <div slot="header">
    <!-- iOS look: nav bar with a back control, then the large title (as on the other pushed screens) -->
    <ToolbarGrid>
      <NBackButton slot="left" />
    </ToolbarGrid>
    <h1 class="ios-large-title">
      <span>{Lang.t('routes.afternomie', 'AfterNomie')}</span>&nbsp;<span class="redText"
        >{Lang.t('routes.beta', 'BETA')}</span
      >
    </h1>
  </div>
  <AnalyticsView />
</Layout>

<style>
  .redText {
    color: rgb(33, 147, 214);
  }
  .blackText {
    color: black;
    font-weight: bold;
  }
</style>
