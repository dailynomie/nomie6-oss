<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): an app-native select, so it looks the same in every browser.
  // The row shows the current value; a tap opens the iOS action sheet with a tick on the current option.
  import { openPopMenu } from '../pop-menu/usePopmenu'

  type Option = { value: any; label: string; disabled?: boolean }

  let {
    value = $bindable(),
    options = [] as Array<Option>,
    title = '',
    placeholder = '',
    compact = false,
    disabled = false,
    className = '',
    ariaLabel = undefined,
    onchange = undefined,
  } = $props<{
    value?: any
    options?: Array<Option>
    title?: string
    placeholder?: string
    compact?: boolean
    disabled?: boolean
    className?: string
    ariaLabel?: string
    onchange?: (value: any) => void
  }>()

  const id = `select-${Math.random().toString(36).slice(2, 9)}`

  let currentLabel = $derived(options.find((o) => o.value == value)?.label ?? (value || value === 0 ? `${value}` : placeholder))
  let isPlaceholder = $derived(!options.some((o) => o.value == value) && !(value || value === 0))

  function pick(option: Option) {
    value = option.value
    onchange?.(option.value)
  }

  function open() {
    if (disabled) return
    openPopMenu({
      id,
      title,
      show: true,
      buttonView: 'list',
      buttons: options.map((option) => ({
        title: option.label,
        checked: option.value == value,
        disabled: option.disabled,
        click: () => pick(option),
      })),
    })
  }
</script>

<button
  type="button"
  aria-label={ariaLabel || title || currentLabel}
  {disabled}
  class="ios-select {compact ? 'ios-select-compact' : 'ios-select-row'} {className}"
  onclick={open}
>
  <span class="ios-select-value" class:is-placeholder={isPlaceholder}>{currentLabel}</span>
  <svg class="ios-select-chevron" width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
    <path d="M1 5l4-4 4 4M1 9l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

<style>
  .ios-select {
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
  .ios-select:disabled {
    opacity: 0.4;
    cursor: default;
  }
  /* a row select: the value and chevron at the right of a list row */
  .ios-select-row {
    min-height: 44px;
  }
  /* a compact select: a small fill pill, for hour, minute and day pickers */
  .ios-select-compact {
    height: 32px;
    padding: 0 10px;
    border-radius: 8px;
    background: var(--ios-fill);
    color: var(--ios-label);
    font-size: 17px;
  }
  .ios-select-value.is-placeholder {
    color: var(--ios-label2);
  }
  .ios-select-chevron {
    flex-shrink: 0;
    opacity: 0.6;
  }
</style>
