<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../../../store/lang'
  // iOS look (guide 5.10, ring): the habit result is a 10 px ring with round caps, starting at the top.
  // Achieved is the green token, the rest the fill token. The tracker emoji sits in the centre.
  const {
    widget = $bindable(),
    usage = $bindable(),
    trackable = $bindable(undefined),
    logs = $bindable(undefined),
  } = $props()

  const RADIUS = 50
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  const countOccurrences = (arr: Array<number>, val: number) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0)

  let total = $derived(usage ? usage.values.length : 0)
  let kept = $derived(usage ? countOccurrences(usage.values, 1) : 0)
  let missed = $derived(total - kept)
  let keptPercent = $derived(total ? Math.round((kept / total) * 100) : 0)
  let missedPercent = $derived(total ? Math.round((missed / total) * 100) : 0)
  let achievedLabel = $derived(usage?.trackable?.tracker?.habitChoice?.[0] || 'Achieved')
  let missedLabel = $derived(usage?.trackable?.tracker?.habitChoice?.[1] || 'Missed')
  let arcLength = $derived((keptPercent / 100) * CIRCUMFERENCE)
</script>

{#if usage && total}
  <div class="ios-habit">
    <div
      class="ios-ring"
      role="img"
      aria-label={Lang.t('dashboard.habit-aria', { label: achievedLabel, kept, total, percent: keptPercent })}
    >
      <svg viewBox="0 0 120 120" width="112" height="112" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--ios-fill)" stroke-width="10" />
        {#if kept > 0}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--ios-good)"
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="{arcLength} {CIRCUMFERENCE}"
            transform="rotate(-90 60 60)"
          />
        {/if}
      </svg>
      <span class="ios-ring-emoji" aria-hidden="true">{usage.trackable?.tracker?.emoji ?? ''}</span>
    </div>

    <ul class="ios-legend">
      <li>
        <span class="ios-dot" style="background: var(--ios-good)"></span>
        <span class="ios-legend-label">{achievedLabel}</span>
        <span class="ios-legend-value">{kept} <span class="ios-legend-percent">({keptPercent}%)</span></span>
      </li>
      <li>
        <span class="ios-dot" style="background: var(--ios-fill)"></span>
        <span class="ios-legend-label">{missedLabel}</span>
        <span class="ios-legend-value">{missed} <span class="ios-legend-percent">({missedPercent}%)</span></span>
      </li>
    </ul>
  </div>
{:else}
  <p class="ios-empty">{Lang.t('dashboard.not-enough-data', 'Not enough data')}</p>
{/if}

<style global lang="postcss">
  /* The ios-* classes are prefixed, so they are safe as global rules. The value rules are used by the value widgets too. */
  .dashboard-widget.type-value .widget-main {
    @apply items-center;
    @apply justify-center;
    @apply flex;
    @apply flex-col;
  }
  .value .current {
    @apply text-2xl lg:text-4xl;
    @apply text-center;
    @apply font-bold;
  }

  .ios-habit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    /* the widget's value styles set a large bold font on the parent; reset it here */
    font-size: 13px;
    font-weight: 400;
    color: var(--ios-label);
  }
  .ios-ring {
    position: relative;
    width: 112px;
    height: 112px;
  }
  .ios-ring svg {
    position: absolute;
    inset: 0;
  }
  .ios-ring-emoji {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    line-height: 1;
  }
  .ios-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ios-legend li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 18px;
  }
  .ios-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ios-legend-label {
    flex: 1;
    min-width: 0;
    color: var(--ios-label2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ios-legend-value {
    font-weight: 600;
    color: var(--ios-label);
    white-space: nowrap;
  }
  .ios-legend-percent {
    font-weight: 400;
    color: var(--ios-label2);
  }
  .ios-empty {
    font-size: 15px;
    line-height: 20px;
    font-weight: 400;
    color: var(--ios-label2);
    text-align: center;
  }
</style>
