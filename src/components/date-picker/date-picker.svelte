<svelte:options runes={true} />

<script lang="ts">
  // vendors
  import dayjs from 'dayjs'
  // utils
  import { createEventDispatcher } from 'svelte'
  import IosDateTimeField from '../ios-date/ios-datetime-field.svelte'

  import { Prefs } from '../../domains/preferences/Preferences'

  // data

  //consts
  const dispatch = createEventDispatcher()
  let { date = $bindable(), time = $bindable(), className, style, size } = $props()

  const dtlFormat = 'YYYY-MM-DDTHH:mm'
  // An existing entry shows its own date and time; only a new entry starts from now
  let localDate = $state<any>(dayjs(time ? new Date(time) : new Date()).format(dtlFormat))
  let lastTime = $state(time)
  let dateTimeFormat = $derived($Prefs.use24hour ? 'dd/mm/yyyy HH:mm' : 'mm/dd/yyyy hh:mm a')

  $effect(() => {
    if (time) {
      if (time !== lastTime) {
        lastTime = time
        localDate = dayjs(new Date(time)).format(dtlFormat)
      }
    } else {
      localDate = dayjs(new Date()).format(dtlFormat)
    }
  })

  function fireChange(evt: any) {
    date = new Date(evt.target.value)
    time = date.getTime()
    dispatch('change', date)
  }
</script>

<div class="n-date-picker {className}" {style}>
  <!-- iOS look (D-native): the app's own date and time field, the same in every browser -->
  <IosDateTimeField
    bind:value={localDate}
    title="Date and time"
    onchange={(next) => fireChange({ target: { value: next } })}
  />
</div>

<style global lang="postcss">
  .native-datetime,
  .n-date-picker {
    @apply text-sm;
    /* @apply bg-ios-card; */
    @apply bg-transparent;
    @apply text-ios-label;
    @apply px-2 py-1;
    @apply rounded-md;
    @apply flex-grow flex-shrink flex;
    @apply w-auto;
    @apply mx-auto;
    @apply text-center;
    @apply placeholder-ios-label2;
  }
  .native-datetime.size-lg {
    @apply text-lg;
    @apply px-2 py-2;
  }
  .native-datetime.size-sm {
    @apply text-sm;
    @apply px-2 py-2;
  }
</style>
