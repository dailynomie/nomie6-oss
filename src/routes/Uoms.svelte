<svelte:options runes={true} />

<script lang="ts">
  import Layout from '../domains/layout/layout.svelte'
  import ToolbarGrid from '../components/toolbar/toolbar-grid.svelte'
  // import UomsView from '../domains/uom/uoms-view.svelte'
  import Button from '../components/button/button.svelte'
  import IonIcon from '../components/icon/ion-icon.svelte'
  import { PlusIcon } from '../components/icon/nicons'
</script>

<Layout checkIn={false}>
  <div slot="header">
    <ToolbarGrid>
      <Button slot="left" icon on:click={() => {}}>
        <IonIcon icon={PlusIcon} className="text-ios-tint" />
      </Button>
    </ToolbarGrid>
    <h1 class="ios-large-title">Units of Measure</h1>
  </div>
  <!-- <UomsView /> -->
</Layout>
