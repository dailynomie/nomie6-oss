<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import type TrackerClass from '../../../modules/tracker/TrackerClass'
  import Toolbar from '../../../components/toolbar/toolbar.svelte';
  import ButtonGroup from '../../../components/button-group/button-group.svelte';

  const dispatch = createEventDispatcher()

  export let tracker: TrackerClass
  export let value = 1

  let tempValue: number
  $: tempValue = value

  $: if (tempValue) {
      console.log("tempValue: ",tempValue)
      dispatch('change', tempValue)
    }

  let habittrue = tracker.habitChoice[0] || "Missed"
  let habitfalse = tracker.habitChoice[1] || "Achieved"
  

</script>

<div class="picker-input-wrapper filler overflow-y-auto max-h-full min-h-0">
  <Toolbar>
    <ButtonGroup
      bind:value={tempValue}
      className="max-w-sm mx-auto"
      buttons={[
        { label: habittrue, value: 1 },
        { label: habitfalse, value: -1 },
      ]}
    />
  </Toolbar>
 
</div>

<style lang="postcss" global>
  .tracker-input.picker {
  }

  .input-modal.type-picker {
    @apply overflow-y-auto;
    max-height: 75vh;
  }
  .picker-toggle {
    position: absolute !important;
    top: 0;
    left: 10px;
    z-index: 2000;
  }
  .n-picker-list .n-input-container {
    @apply bg-white dark:bg-black;
    @apply rounded-lg;
  }
</style>
