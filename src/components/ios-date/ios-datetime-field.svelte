<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): an app-native date and time field. The value is 'YYYY-MM-DDTHH:mm',
  // the same string a native datetime-local input uses. The date opens the month sheet; hour and minute are compact selects.
  import dayjs from 'dayjs'
  import IosDateField from './ios-date-field.svelte'
  import IosSelect from '../ios-select/ios-select.svelte'

  let {
    value = $bindable(''),
    disabled = false,
    title = 'Date and time',
    onchange = undefined,
  } = $props<{
    value?: string
    disabled?: boolean
    title?: string
    onchange?: (value: string) => void
  }>()

  const pad = (n: number) => `${n}`.padStart(2, '0')
  const hours = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }))
  const minutes = Array.from({ length: 60 }, (_, m) => ({ value: pad(m), label: pad(m) }))

  let parsed = $derived(value && dayjs(value).isValid() ? dayjs(value) : dayjs())
  let datePart = $derived(parsed.format('YYYY-MM-DD'))
  let hourPart = $derived(parsed.format('HH'))
  let minutePart = $derived(parsed.format('mm'))

  function emit(next: string) {
    value = next
    onchange?.(next)
  }
  function setDate(date: string) {
    emit(`${date}T${hourPart}:${minutePart}`)
  }
  function setHour(hour: string) {
    emit(`${datePart}T${hour}:${minutePart}`)
  }
  function setMinute(minute: string) {
    emit(`${datePart}T${hourPart}:${minute}`)
  }
</script>

<div class="ios-datetime" class:is-disabled={disabled}>
  <IosDateField value={datePart} onchange={setDate} {disabled} compact {title} />
  <IosSelect value={hourPart} options={hours} onchange={setHour} {disabled} compact title="Hour" />
  <span class="ios-datetime-sep">:</span>
  <IosSelect value={minutePart} options={minutes} onchange={setMinute} {disabled} compact title="Minute" />
</div>

<style>
  .ios-datetime {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ios-datetime.is-disabled {
    opacity: 0.4;
  }
  .ios-datetime-sep {
    color: var(--ios-label);
    font-weight: 600;
  }
</style>
