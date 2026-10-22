<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): an app-native date field, so it looks the same in every browser.
  // The value is 'YYYY-MM-DD' (the same string a native date input uses). A tap opens the iOS sheet with a month grid.
  import dayjs from 'dayjs'
  import { getDateFormats } from '../../domains/preferences/Preferences'
  import { openPopMenu } from '../pop-menu/usePopmenu'
  import IosCalendarSheet from './ios-calendar-sheet.svelte'
  import { Lang } from '../../store/lang'

  let {
    value = $bindable(''),
    disabled = false,
    compact = false,
    className = '',
    title = 'Date',
    onchange = undefined,
  } = $props<{
    value?: string
    disabled?: boolean
    compact?: boolean
    className?: string
    title?: string
    onchange?: (value: string) => void
  }>()

  const id = `date-${Math.random().toString(36).slice(2, 9)}`

  let label = $derived(
    value && dayjs(value).isValid() ? dayjs(value).format(`ddd ${getDateFormats().shortDate}`) : Lang.t('ui.pick-a-date', 'Pick a date')
  )

  function pick(next: string) {
    value = next
    onchange?.(next)
  }

  function open() {
    if (disabled) return
    openPopMenu({
      id,
      title,
      show: true,
      buttons: [],
      component: IosCalendarSheet,
      componentProps: { value, onpick: pick, closeId: `popmenu-${id}` },
    })
  }
</script>

<button
  type="button"
  aria-label={title}
  {disabled}
  class="ios-date-field {compact ? 'ios-date-compact' : 'ios-date-row'} {className}"
  onclick={open}
>
  <span class="ios-date-value">{label}</span>
  <svg class="ios-date-chevron" width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
    <path
      d="M1 5l4-4 4 4M1 9l4 4 4-4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</button>

<style>
  .ios-date-field {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ios-tint);
    font-size: 17px;
    line-height: 22px;
    white-space: nowrap;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .ios-date-field:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ios-date-row {
    min-height: 44px;
  }
  .ios-date-compact {
    height: 32px;
    padding: 0 10px;
    border-radius: 8px;
    background: var(--ios-fill);
    color: var(--ios-label);
  }
  .ios-date-chevron {
    flex-shrink: 0;
    opacity: 0.6;
  }
</style>
