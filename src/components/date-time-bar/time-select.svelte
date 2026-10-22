<svelte:options runes={true} />

<script lang="ts">
  import IosSelect from '../ios-select/ios-select.svelte'
  import dayjs from 'dayjs'
  import { createEventDispatcher } from 'svelte'

  import { Prefs } from '../../domains/preferences/Preferences'
  import { Lang } from '../../store/lang'

  const dispatch = createEventDispatcher()
  const { value, className, style } = $props()

  let lastValue = $state(undefined) // Value to hold last reaction
  let hour = $state(undefined) // local hour
  let minute = $state(undefined) // local minute
  let ampm = $state(undefined) // local ampm

  const is24Hour = $derived($Prefs.use24hour)

  // 24 Hour Array
  let hours24 = Array(24)
    .fill(0)
    .map((t, i) => {
      return i
    })
  // 12 Hour Array
  let hours12 = Array(12)
    .fill(0)
    .map((t, i) => {
      return i + 1
    })
  // 60 minute Array
  let minutes = Array(60)
    .fill(0)
    .map((t, i) => {
      return i
    })

  // Reactively Set Hours
  const hours = $derived(is24Hour ? hours24 : hours12)

  $effect(() => {
    if (value && value.format('hh:mm a') !== dayjs(lastValue || '2010-01-01T01:01:01').format('hh:mm a')) {
      lastValue = value
      hour = parseInt(value.format('HH'))
      // hour12 = ((hour + 11) % 12) + 1
      minute = parseInt(value.format('mm'))
      ampm = value.format('a')
      // lastAMPM = ampm
    }
  })

  function onChange(evt) {
    let ogDate = dayjs(value)
    let ogDay = ogDate.get('day')
    let newHour = hour

    if (!is24Hour) {
      if (newHour == 12 && ampm == 'am') {
        newHour = 0
      } else if (ampm == 'am' && newHour > 12) {
        newHour = newHour - 12
      } else if (ampm == 'pm' && newHour < 12) {
        newHour = newHour + 12
      }
    }
    const updatedDate = ogDate.set('hour', newHour).set('minute', minute).set('day', ogDay)
    dispatch('change', updatedDate)
  }
</script>

{#if value}
  <div class="time-select-wrapper {className}" {style}>
    <div class="time-select">
      <!-- Loop over hours -->
      {#if is24Hour}
        <IosSelect
          compact
          title={Lang.t('ui.hour', 'Hour')}
          bind:value={hour}
          onchange={() => onChange()}
          options={hours.map((h) => ({ value: h, label: `${h}`.length == 1 ? `0${h}` : `${h}` }))}
        />
      {:else}
        <IosSelect
          compact
          title={Lang.t('ui.hour', 'Hour')}
          bind:value={hour}
          onchange={() => onChange()}
          options={hours.map((h) => ({ value: h, label: `${h}`.length == 1 ? `0${h}` : `${h}` }))}
        />
      {/if}
      <span class="blinker">:</span>
      <!-- Loop over minutes -->
      <IosSelect
        compact
        title={Lang.t('ui.minute', 'Minute')}
        bind:value={minute}
        onchange={() => onChange()}
        options={minutes.map((m) => ({ value: m, label: `${m}`.length == 1 ? `0${m}` : `${m}` }))}
      />
      <!-- If is not 24 hour - show ampm -->
      {#if !is24Hour}
        <IosSelect
          compact
          title={Lang.t('ui.am-or-pm', 'AM or PM')}
          bind:value={ampm}
          onchange={() => onChange()}
          options={[
            { value: 'am', label: 'AM' },
            { value: 'pm', label: 'PM' },
          ]}
        />
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss" global>
  /* .time-select {
    @apply px-2 py-1;
    @apply mr-1;
    @apply flex;
    @apply items-center;
    @apply justify-end;
    @apply flex-grow flex-shrink;
    @apply text-ios-label2;
    @apply bg-ios-card;
    @apply rounded-lg;
    @apply h-6;
    @apply text-xs;
  } */
  /* select {
    @apply text-xs;
    flex-shrink: 0;
    flex-grow: 0;
    @apply appearance-none;
    @apply bg-ios-card;
    text-align: center;
    -webkit-appearance: none;
    @apply p-1;
    @apply rounded-md;
  } */
</style>
