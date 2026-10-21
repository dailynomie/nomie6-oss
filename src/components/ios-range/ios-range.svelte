<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): an app-native slider (the iOS track, fill and thumb), not the browser's range input.
  // Pointer drag and the arrow keys change the value; the value snaps to the step.
  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    label = 'Value',
    onchange = undefined,
  } = $props<{
    value?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    label?: string
    onchange?: (value: number) => void
  }>()

  let track: HTMLDivElement | undefined = $state()
  let dragging = $state(false)

  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const snap = (n: number) => {
    const stepped = Math.round((n - min) / step) * step + min
    return clamp(Number(stepped.toFixed(6)))
  }
  let percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100)

  function set(next: number) {
    const v = snap(next)
    if (v === value) return
    value = v
    onchange?.(v)
  }

  function fromPointer(clientX: number) {
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    set(min + ratio * (max - min))
  }

  function down(evt: PointerEvent) {
    if (disabled) return
    dragging = true
    ;(evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId)
    fromPointer(evt.clientX)
  }
  function move(evt: PointerEvent) {
    if (dragging) fromPointer(evt.clientX)
  }
  function up() {
    dragging = false
  }

  function key(evt: KeyboardEvent) {
    if (disabled) return
    if (evt.key === 'ArrowRight' || evt.key === 'ArrowUp') set(value + step)
    else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowDown') set(value - step)
    else if (evt.key === 'Home') set(min)
    else if (evt.key === 'End') set(max)
    else return
    evt.preventDefault()
  }
</script>

<div
  class="ios-range"
  class:is-disabled={disabled}
  role="slider"
  tabindex={disabled ? -1 : 0}
  aria-label={label}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  aria-disabled={disabled}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onkeydown={key}
>
  <div class="ios-range-track" bind:this={track}>
    <div class="ios-range-fill" style="width: {percent}%"></div>
    <div class="ios-range-thumb" style="left: {percent}%"></div>
  </div>
</div>

<style>
  .ios-range {
    position: relative;
    height: 44px;
    display: flex;
    align-items: center;
    touch-action: none;
    cursor: pointer;
    user-select: none;
  }
  .ios-range.is-disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ios-range:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--ios-tint);
    border-radius: 12px;
  }
  .ios-range-track {
    position: relative;
    width: 100%;
    height: 4px;
    margin: 0 14px;
    border-radius: 2px;
    background: var(--ios-fill);
  }
  .ios-range-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-radius: 2px;
    background: var(--ios-tint);
  }
  .ios-range-thumb {
    position: absolute;
    top: 50%;
    width: 28px;
    height: 28px;
    margin-left: -14px;
    margin-top: -14px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
  }
</style>
