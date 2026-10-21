<svelte:options runes={true} />

<script lang="ts">
  import IosSelect from '../ios-select/ios-select.svelte'
  // Svelte
  import { createEventDispatcher } from 'svelte'
  // Utils
  import time from '../../utils/time/time'
  // export let started = undefined;

  // Consts
  const dispatch = createEventDispatcher()

  // methods
  const methods = {
    // +ADD to unit
    add(unit) {
      switch (unit) {
        case 'hours':
          value = value + 60 * 60
          break
        case 'minutes':
          value = value + 60
          break
        case 'seconds':
          value = value + 1
          break
      }
      dispatch('change', value)
    },
    // -SUBTRACT from Unit
    subtract(unit) {
      switch (unit) {
        case 'hours':
          if (value > 60 * 60) {
            value = value - 60 * 60
          }
          break
        case 'minutes':
          if (value > 60) {
            value = value - 60
          }
          break
        case 'seconds':
          if (value > 1) {
            value = value - 1
          }
          break
      }
      // Fire off change event
      dispatch('change', value)
    },
    // Get Unit Value - for select value
    getUnitValue(unit) {
      return data[unit] || '00'
    },
    // Set unit value by select box action
    setUnitValue(event, unit) {
      // Set to init
      let selected = parseInt(`${event?.target?.value ?? event}`)
      // Set temp time chunks
      let dateChunks = {
        hours: data.hours,
        minutes: data.minutes,
        seconds: data.seconds,
      }
      // Set new unit
      dateChunks[unit] = time.padTime(selected)
      // New Set of the value to Seconds
      value = time.unitsToSeconds(dateChunks.hours, dateChunks.minutes, dateChunks.seconds)
      // Fire off change
      dispatch('change', value)
    },
    // Takes 00:00:00 and converts it to seconds
    timeStringToNode(str) {
      let initialTime = time.secondsToTime(str).split(':')
      let payload = {
        hours: initialTime[0],
        minutes: initialTime[1],
        seconds: initialTime[2],
      }
      return payload
    },
  }

  let { className, value = $bindable(), size } = $props()

  // Data
  let data = $state({
    ...methods.timeStringToNode(value),
    computed: {
      totalSeconds: 0,
    },
    localValue: value,
  })

  // Watch for Value Change
  $effect(() => {
    if (value > -1) {
      // Get the Chunks from Seconds
      let dateChunks = methods.timeStringToNode(value)
      // Set local data chunks to new value
      data.hours = time.padTime(dateChunks.hours)
      data.minutes = time.padTime(dateChunks.minutes)
      data.seconds = time.padTime(dateChunks.seconds)
    }
  })
</script>

<div class="n-counter-manual size-{size} {className}">
  <div class="unit hours">
    <IosSelect
      compact
      title="Hours"
      ariaLabel="Hours"
      value={methods.getUnitValue('hours')}
      options={time.getNumberedArray(300).map((unit) => ({ value: unit, label: `${unit}` }))}
      onchange={(next) => methods.setUnitValue(next, 'hours')}
    />

    <label for="hours" aria-controls="hours">Hour</label>
  </div>
  <!-- Minutes -->
  <div class="unit hours">
    <IosSelect
      compact
      title="Minutes"
      ariaLabel="Minutes"
      value={methods.getUnitValue('minutes')}
      options={time.getNumberedArray(59).map((unit) => ({ value: unit, label: `${unit}` }))}
      onchange={(next) => methods.setUnitValue(next, 'minutes')}
    />
    <!-- <NIcon icon={ChevronDown} className="fill-solid" /> -->
    <label for="minutes" aria-controls="minutes">Min</label>
  </div>
  <!-- SEconds -->
  <div class="unit seconds">
    <IosSelect
      compact
      title="Seconds"
      ariaLabel="Seconds"
      value={methods.getUnitValue('seconds')}
      options={time.getNumberedArray(59).map((unit) => ({ value: unit, label: `${unit}` }))}
      onchange={(next) => methods.setUnitValue(next, 'seconds')}
    />
    <!-- <NIcon icon={ChevronDown} className="fill-solid" /> -->
    <label for="seconds" aria-controls="seconds">Sec</label>
  </div>
</div>

<style lang="postcss" global>
  .n-counter-manual .unit svg {
    position: absolute;
    top: 20px;
    right: 2px;
    height: 16px;
    pointer-events: none;
  }
  .n-counter-manual {
    @apply grid;
    @apply grid-cols-3;
    @apply gap-2;
  }
  .n-counter-manual span {
    line-height: 40px;
    font-size: 40px;
  }
  .n-counter-manual .unit {
    @apply rounded-lg;
    @apply overflow-hidden;
    @apply text-center;
    @apply relative;
    @apply flex;
    @apply flex-col;
  }

  /* iOS look: each unit is a card tile with the number large; the app's select (IosSelect) renders as the tile */
  .n-counter-manual .unit :global(.ios-select-compact) {
    @apply w-full;
    @apply justify-center;
    height: 56px;
    padding: 0 4px;
    border-radius: 12px;
    background: var(--ios-card);
    color: var(--ios-label);
    border: 0.5px solid var(--ios-separator);
    font-size: 36px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .n-counter-manual .unit {
    width: 100%;
  }
  /* the tile is the control; the chevron would sit on the digits */
  .n-counter-manual .unit :global(.ios-select-chevron) {
    display: none;
  }
  .n-counter-manual.size-sm .unit :global(.ios-select-compact) {
    height: 28px;
    font-size: 16px;
    border: none;
  }
  .n-counter-manual .unit select {
    @apply appearance-none;
    @apply rounded-lg;
    @apply bg-ios-card;
    @apply text-ios-label;
    @apply border border-ios-separator;
    @apply h-14;
    @apply text-4xl;
    @apply font-bold;
    @apply outline-none;
    @apply focus:ring-2 ring-ios-tint ring-inset;
  }
  .n-counter-manual .unit select option {
    text-align: center;
  }
  .n-counter-manual .unit label {
    @apply font-bold;
    @apply text-ios-label2;
    @apply text-sm;
    @apply p-1;
  }

  .n-counter-manual.size-sm {
    @apply w-auto;
    @apply pt-2;
  }

  .n-counter-manual.size-sm .unit {
    @apply w-full;
  }

  .n-counter-manual.size-sm .unit select {
    @apply h-7;
    @apply text-base;
    @apply text-center;
    @apply border-none;
    @apply bg-ios-card;
    @apply m-0;
  }

  .n-counter-manual.size-sm .unit label {
    @apply text-xs;
    @apply font-medium;
  }
</style>
