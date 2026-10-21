<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from './../icon/ion-icon.svelte'
  import { createEventDispatcher } from 'svelte'
  import is from '../../utils/is/is'
  import Avatar from '../avatar/avatar.svelte'
  import Button from '../button/button.svelte'
  import TimeBalls from '../time-balls/time-balls.svelte'

  import { CheckmarkOutline, MoreVertical } from '../icon/nicons'

  const { title, subtitle, value, color, emoji, avatar, style, id, hideMore, hideValue, className, compact, moreIcon = MoreVertical, oneTap, hoursUsed } = $props()
  // a habit shows a thumb for its state; any other tracker shows its value
  // a habit that is done shows a green check in a soft circle (guide 5.2)
  const habitDone = $derived(id.includes('habit') && value >= 0.3)
  const valueLabel = $derived(
    id.includes('habit') ? (value < -0.5 ? '👎' : value < 0.3 ? '🤙' : '👍') : value
  )

  let clickSkip = $state(undefined)

  const dispatch = createEventDispatcher()

  let emojiSize = $derived(compact ? 30 : 20)
  // Experiment check-in trackers have an id that contains exp_
  let isExperiment = $derived(is.truthy(id) && String(id).includes('exp_'))

  async function more() {
    dispatch('more')
  }
</script>

<div class="button-wrapper relative w-full flex-grow flex-shrink  {compact ? 'compact' : 'normal'}">
  {#if !hideMore}
    <button
      type="button"
      aria-label="More about this Trackable"
      class="more {is.truthy(value) ? 'has-value text-ios-label' : 'no-value text-ios-label2'}"
      on:click={(evt) => {
        evt.preventDefault()
        evt.stopPropagation()
        more()
      }}
    >
      <IonIcon icon={moreIcon} size={20} />
    </button>
  {/if}

  <Button
    {id}
    ariaLabel={title || 'button'}
    title={title || 'button'}
    color="clear"
    className="w-full {className} {compact ? 'compact' : 'normal'} shortcut-button {is.truthy(value)
      ? 'has-value'
      : 'no-value'}
  {compact ? 'compact' : ''} {isExperiment ? 'experiment-check-in' : ''}"
    style={[style, `--tracker-color:${color};`].join('')}
    on:longpress={() => {
      dispatch('longpress')
      clickSkip = true
    }}
    on:click={() => {
      if (!clickSkip) {
        dispatch('click')
      }
      clickSkip = undefined
    }}
  >
    <div class="emoji-holder" style={is.truthy(value) ? 'color:#FFF' : `color:${color}`}>
      {#if emoji || avatar || title}
        {#key emoji || avatar || title}
          <Avatar label={title} {emoji} src={avatar} size={emojiSize} />
        {/key}
      {/if}
      <slot name="emoji" />
    </div>

    <div class="subtitle-slot"><slot name="subtitle" /></div>

    <slot />
    {#if value && !hideValue && !compact}
      <div class="tile-value {String(value).length > 4 ? 'long' : ''}">
        {#if habitDone}
            <span class="habit-done"><IonIcon icon={CheckmarkOutline} size={16} /></span>
          {:else}
            <span class="value">{valueLabel}</span>
          {/if}
      </div>
    {/if}
    <div class="title-value">
      {#if title}
        <div class="title {title.length > 15 ? 'long' : ''} {compact ? 'line-clamp-1' : 'line-clamp-2'}">{title}</div>
      {/if}
      <div class="value-sub">
        {#if value && !hideValue && compact}
          {#if habitDone}
            <span class="habit-done"><IonIcon icon={CheckmarkOutline} size={16} /></span>
          {:else}
            <span class="value">{valueLabel}</span>
          {/if}
        {/if}
        {#if subtitle}
          <span class="subtitle">{subtitle}</span>
        {/if}
      </div>
    </div>
    <!-- highlight -->
    <div class="highlight {oneTap ? 'one-tap' : ''}">
      <TimeBalls color="#FFF" hours={hoursUsed} />
    </div>
  </Button>
</div>

<style global lang="postcss">
  .shortcut-button {
    border-radius: 18px;
    box-shadow: none;
    background: var(--ios-card);
    @apply overflow-visible;
    @apply text-ios-label;
    overflow:hidden;
  }
  .shortcut-button.normal {
    height: 112px;
  }
  .shortcut-button.compact {
    @apply h-14;
  }
  .shortcut-button .title-value {
    @apply leading-tight;
  }
  .shortcut-button.compact .title-value {
    @apply text-ios-label;
    @apply absolute;
    @apply left-12 right-3 top-0 bottom-0;
    @apply text-base;
    @apply p-0;

    @apply flex flex-col justify-center justify-items-center;
  }
  .shortcut-button .title {
    font-size: 15px;
    font-weight: 600;
    line-height: 18px;
  }
  .shortcut-button .title.long {
    font-size: 14px;
  }
  .shortcut-button.normal .emoji-holder {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--tracker-color) 16%, transparent);
    color: var(--ios-label);
  }
  :global(html.dark) .shortcut-button.normal .emoji-holder {
    background: color-mix(in srgb, var(--tracker-color) 28%, transparent);
  }
  .shortcut-button.compact .emoji-holder {
    position: absolute;
    top: 50%;
    left: 10px;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--tracker-color) 16%, transparent);
    color: var(--ios-label);
  }
  :global(html.dark) .shortcut-button.compact .emoji-holder {
    background: color-mix(in srgb, var(--tracker-color) 28%, transparent);
  }
  /* a done habit: a 26 px soft green circle with a green check (guide 5.2) */
  .shortcut-button .habit-done {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    background: var(--ios-good-soft);
    color: var(--ios-good);
  }
  /* iOS look (Phase 4, decision B): on a normal tile the value is top right, and the menu button moves to the bottom right */
  .shortcut-button.normal .tile-value {
    position: absolute;
    top: 14px;
    right: 12px;
    max-width: calc(100% - 60px);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-family: var(--ios-font-rounded);
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: var(--ios-label);
    z-index: 10;
  }
  .shortcut-button.normal .tile-value.long {
    font-size: 18px;
  }
  .button-wrapper.normal .more {
    top: auto;
    bottom: 0;
    right: 0;
  }
  .shortcut-button.normal .title-value {
    padding-right: 40px;
  }
  .button-wrapper .more {
    @apply absolute top-0 right-0 flex items-center justify-center z-40 w-10 h-10 rounded-full;
  }
  .shortcut-button .title-value {
    @apply absolute;
    @apply left-0 right-0 bottom-0;
    @apply px-3 pb-3;
  }
  .shortcut-button .subtitle {
    font-size: 12px;
    line-height: 16px;
    color: var(--ios-label2);
  }

  .shortcut-button .value-sub {
    @apply text-ios-label;
    @apply line-clamp-1;
    @apply leading-none;
  }

  .shortcut-button.normal .value-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .shortcut-button.normal .value-sub .value {
    font-size: 15px;
    font-weight: 600;
    line-height: 18px;
    font-family: var(--ios-font-rounded);
    white-space: nowrap;
  }
  .shortcut-button.normal .value-sub .subtitle {
    @apply whitespace-nowrap;
    @apply line-clamp-1;
  }

  .shortcut-button.has-value .value-sub {
    color: var(--ios-label);
  }
  .shortcut-button .value-sub .value {
    @apply leading-tight;
    @apply font-semibold;
  }
  .shortcut-button .n-counter {
    @apply text-sm;
    @apply flex justify-center;
  }
  .shortcut-button .subtitle-slot {
    @apply absolute top-4 left-12;
    @apply pl-1;
  }
  .shortcut-button.compact .subtitle-slot {
    top: auto;
    @apply absolute -bottom-1 right-8 left-8;
    @apply z-40;
    @apply text-center;
    @apply justify-center;
  }

  .shortcut-button.has-value .subtitle-slot .letter-ticker {
    color: #fff;
  }
  .shortcut-button.compact .n-counter {
    @apply text-xs;
    @apply bg-ios-card;
    @apply z-40;
    @apply border border-ios-separator;
    @apply rounded-full;
    @apply shadow-md;
    @apply block;
  }

  .button-wrapper.compact .more {
    @apply w-7;
    @apply opacity-50;
    @apply h-full;
    @apply top-auto;
    @apply z-40;
    @apply rounded-l-none rounded-r-2xl;
  }
  .shortcut-button.in-note {
    @apply ring-2 ring-ios-tint ring-offset-4 ring-offset-ios-card;
    @apply animate-pulse;
  }
  .shortcut-button .highlight {
    @apply rounded-full;
    @apply h-1;
    @apply absolute bottom-1 left-3 right-3;
  }
  .shortcut-button .highlight.one-tap {
    @apply bg-ios-card bg-opacity-40;
  }

  .shortcut-button.has-value .highlight.one-tap {
    @apply bg-white bg-opacity-20;
  }

  .shortcut-button.compact .highlight {
    @apply hidden;
  }

  /* Experiment check-in trackers: a soft tint with a dashed tint border */
  /* A value today: a small value in the top-right corner, and a soft tint glow around the card */
  /* iOS look: a tile with a value gets a light tint of its colour, and the glow. Both sizes (normal and compact) share this rule. */
  .shortcut-button.has-value {
    background: color-mix(in srgb, var(--tracker-color) 12%, var(--ios-card));
    box-shadow: 0 0 10px 0 color-mix(in srgb, var(--tracker-color) 22%, transparent);
  }
  :global(html.dark) .shortcut-button.has-value {
    background: color-mix(in srgb, var(--tracker-color) 22%, var(--ios-card));
    box-shadow: 0 0 14px 2px color-mix(in srgb, var(--tracker-color) 40%, transparent);
  }

  .shortcut-button.experiment-check-in {
    background: var(--ios-tint-soft);
    border: 1.5px dashed var(--ios-tint);
  }
</style>
