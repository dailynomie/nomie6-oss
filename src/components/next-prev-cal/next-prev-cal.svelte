<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '../button/button.svelte'
  import IonIcon from '../icon/ion-icon.svelte'
  import { CalendarOutline, ChevronBackOutline, ChevronForwardOutline } from '../icon/nicons'

  const dispatch = createEventDispatcher()

  const { isToday, hideCal, style, className } = $props()
</script>

<div class="flex items-center flex-grow-0 flex-shrink-0 next-prev-cal {className}" {style}>
  <Button
    className="previous-action"
    ariaLabel="Previous day"
    icon
    delay={0}
    on:click={() => {
      dispatch('previous')
    }}
  >
    <IonIcon icon={ChevronBackOutline} size={24} className="text-ios-tint" />
  </Button>
  {#if !hideCal}
    <Button
      className="calendar-action {isToday ? 'tap-icon' : 'text-ios-ontint bg-ios-tint'}"
      ariaLabel="Choose a date"
      delay={0}
      icon
      color="transparent"
      shape="round"
      on:click={() => {
        dispatch('calendar')
      }}
    >
      <IonIcon icon={CalendarOutline} size={24} />
    </Button>
  {/if}
  <slot />
  <Button
    className="next-action"
    ariaLabel="Next day"
    delay={0}
    icon
    on:click={() => {
      dispatch('next')
    }}
  >
    <IonIcon icon={ChevronForwardOutline} size={24} className="text-ios-tint" />
  </Button>
</div>

<style lang="postcss">
  .next-prev-cal {
    flex-shrink: 1;
    flex-grow: 0;
  }
</style>
