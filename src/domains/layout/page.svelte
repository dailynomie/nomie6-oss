<script lang="ts">
  // svlete
  import { navigate } from '../../vendor/svelte-navigator'
  // components
  import NToolbar from '../../components/toolbar/toolbar.svelte'
  import NLayout from './layout.svelte'
  //props
  export let className = undefined
  // export let withBack = false;
  export let title = undefined
  // Dynamic
  $: hasHeader = !!$$slots.header || title
  $: hasSubHeader = !!$$slots['sub-header']

  // methods
</script>

<NLayout pageTitle={title} {className}>
  <div slot="header">
    <slot name="header" />
    {#if hasSubHeader}
      <NToolbar className="sub-header">
        <slot name="sub-header" />
      </NToolbar>
    {/if}
  </div>
  <div slot="content">
    <slot />
  </div>
</NLayout>
