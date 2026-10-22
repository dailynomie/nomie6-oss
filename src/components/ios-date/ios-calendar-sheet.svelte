<svelte:options runes={true} />

<script lang="ts">
  // iOS look (D-native): a month grid inside the action sheet. A tap on a day picks it and closes the sheet.
  import dayjs from 'dayjs'
  import { closeModal } from '../backdrop/BackdropStore2'

  const {
    value = '',
    onpick = undefined,
    closeId = '',
  } = $props<{
    value?: string
    onpick?: (value: string) => void
    closeId?: string
  }>()

  let shown = $state(dayjs(value && dayjs(value).isValid() ? value : undefined).startOf('month'))

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  let days = $derived.by(() => {
    const first = shown.startOf('month')
    const offset = first.day()
    const count = shown.daysInMonth()
    const cells: Array<{ key: string; date: dayjs.Dayjs | null }> = []
    for (let i = 0; i < offset; i++) cells.push({ key: `e${i}`, date: null })
    for (let d = 1; d <= count; d++) {
      const date = first.date(d)
      cells.push({ key: date.format('YYYY-MM-DD'), date })
    }
    return cells
  })

  function pick(date: dayjs.Dayjs) {
    onpick?.(date.format('YYYY-MM-DD'))
    if (closeId) closeModal(closeId)
  }
</script>

<div class="ios-cal">
  <div class="ios-cal-head">
    <button
      type="button"
      class="ios-cal-nav"
      aria-label="Previous month"
      onclick={() => (shown = shown.subtract(1, 'month'))}
    >
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true"
        ><path
          d="M8 2L2 8l6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg
      >
    </button>
    <span class="ios-cal-title">{shown.format('MMMM YYYY')}</span>
    <button type="button" class="ios-cal-nav" aria-label="Next month" onclick={() => (shown = shown.add(1, 'month'))}>
      <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true"
        ><path
          d="M2 2l6 6-6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg
      >
    </button>
  </div>
  <div class="ios-cal-grid ios-cal-weekdays">
    {#each weekdays as wd, i (i)}
      <span class="ios-cal-weekday">{wd}</span>
    {/each}
  </div>
  <div class="ios-cal-grid">
    {#each days as cell (cell.key)}
      {#if cell.date}
        {@const isSelected = cell.date.format('YYYY-MM-DD') === value}
        {@const isToday = cell.date.isSame(dayjs(), 'day')}
        <button
          type="button"
          class="ios-cal-day {isSelected ? 'is-selected' : ''} {isToday ? 'is-today' : ''}"
          aria-label={cell.date.format('dddd D MMMM YYYY')}
          aria-pressed={isSelected}
          onclick={() => pick(cell.date)}
        >
          {cell.date.date()}
        </button>
      {:else}
        <span class="ios-cal-blank"></span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .ios-cal {
    padding: 8px 12px 12px;
    background: var(--ios-card);
    color: var(--ios-label);
    font-size: 17px;
  }
  .ios-cal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 8px;
  }
  .ios-cal-title {
    font-weight: 600;
  }
  .ios-cal-nav {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ios-tint);
    background: transparent;
    border: 0;
  }
  .ios-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    row-gap: 2px;
    justify-items: center;
  }
  .ios-cal-weekday {
    font-size: 13px;
    font-weight: 600;
    color: var(--ios-label2);
    padding: 4px 0;
  }
  .ios-cal-day,
  .ios-cal-blank {
    width: 40px;
    height: 40px;
  }
  .ios-cal-day {
    border-radius: 20px;
    background: transparent;
    border: 0;
    color: var(--ios-label);
    font-variant-numeric: tabular-nums;
  }
  .ios-cal-day.is-today {
    box-shadow: inset 0 0 0 1.5px var(--ios-tint);
  }
  .ios-cal-day.is-selected {
    background: var(--ios-tint);
    color: var(--ios-on-tint);
    font-weight: 600;
  }
</style>
