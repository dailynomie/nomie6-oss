<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../store/lang'

  import dayjs from 'dayjs'
  import Button from '../../components/button/button.svelte'
  import { Prefs } from '../preferences/Preferences'
  import Container from '../../components/container/container.svelte'

  let initialized = $state(false)

  $effect(() => {
    if (!initialized) {
      if (new Date(new Date().setHours(20)).toLocaleTimeString().search('PM') === -1) {
        $Prefs.use24hour = true
        $Prefs.useMetric = true
        $Prefs.weekStarts = 'monday'
      }
      initialized = true
    }
  })
</script>

<Container className="filler px-5 flex items-center justify-center flex-col slide-location -mt-10">
  <div class="pt-3 mx-auto top center-grow min-w-full max-w-xl">
    <p class="mb-4 text-ios-label2 text-center text-sm">{Lang.t('setup.your-preferences', 'Your preferences')}</p>

    <p class="mb-1 text-ios-label2 text-center text-sm">{Lang.t('setup.time', 'Time')}</p>
    <div class="big-group p-2 bg-ios-card flex items-center shadow-lg rounded-2xl">
      <Button
        className="whitespace-no-wrap {!$Prefs.use24hour
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}"
        block
        size="md"
        type="clear"
        delay={20}
        on:click={() => {
          $Prefs.use24hour = false
        }}
      >
        {dayjs().format('h:mma')}
      </Button>
      <Button
        className="whitespace-nowrap {$Prefs.use24hour
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}"
        type="clear"
        block
        size="md"
        delay={20}
        on:click={() => {
          $Prefs.use24hour = true
        }}
      >
        {dayjs().format('HH:mm')}
      </Button>
    </div>

    <p class="mt-4 mb-1 text-ios-label2 text-center text-sm">{Lang.t('setup.units', 'Units')}</p>
    <div class="big-group p-2 bg-ios-card flex items-center shadow-lg rounded-2xl">
      <Button
        className={!$Prefs.useMetric ? 'bg-ios-tint text-ios-ontint font-bold' : 'bg-ios-card text-ios-label2'}
        block
        size="md"
        type="clear"
        delay={20}
        on:click={() => {
          $Prefs.useMetric = false
        }}
      >
        {Lang.t('setup.10-lbs', '10 lbs')}
      </Button>
      <Button
        className=" {$Prefs.useMetric ? 'bg-ios-tint text-ios-ontint font-bold' : 'bg-ios-card text-ios-label2'}"
        type="clear"
        block
        size="md"
        delay={20}
        on:click={() => {
          $Prefs.useMetric = true
        }}
      >
        {Lang.t('setup.4-5-kg', '4.5 kg')}
      </Button>
    </div>

    <p class="mt-4 mb-1 text-ios-label2 text-center text-sm">{Lang.t('setup.week-starts-on', 'Week starts on')}</p>

    <div class="big-group p-2 mt-2 bg-ios-card flex items-center shadow-lg rounded-2xl">
      <Button
        className={$Prefs.weekStarts == 'sunday'
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}
        block
        size="md"
        type="clear"
        delay={20}
        on:click={() => {
          $Prefs.weekStarts = 'sunday'
        }}
      >
        {Lang.t('setup.sun', 'Sun')}
      </Button>
      <Button
        className=" {$Prefs.weekStarts == 'monday'
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}"
        type="clear"
        block
        size="md"
        delay={20}
        on:click={() => {
          $Prefs.weekStarts = 'monday'
        }}
      >
        {Lang.t('setup.mon', 'Mon')}
      </Button>
    </div>
    <p class="mt-4 mb-1 text-ios-label2 text-center text-sm">
      {Lang.t('setup.location-tracking', 'Location tracking')}
    </p>
    <p class="mb-1 text-ios-label2 text-center text-xs">
      {Lang.t('setup.location-tracking-help', 'Nomie saves where you are each time you record data.')}
    </p>

    <div class="big-group p-2 bg-ios-card flex items-center shadow-lg rounded-2xl">
      <Button
        className="whitespace-no-wrap {!$Prefs.alwaysLocate
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}"
        block
        size="md"
        type="clear"
        delay={20}
        on:click={() => {
          $Prefs.alwaysLocate = false
        }}
      >
        {Lang.t('setup.disabled', 'Disabled')}
      </Button>
      <Button
        className="whitespace-nowrap {$Prefs.alwaysLocate
          ? 'bg-ios-tint text-ios-ontint font-bold'
          : 'bg-ios-card text-ios-label2'}"
        type="clear"
        block
        size="md"
        delay={20}
        on:click={() => {
          $Prefs.alwaysLocate = true
        }}
      >
        {Lang.t('setup.enabled', 'Enabled')}
      </Button>
    </div>
  </div>
</Container>

<style lang="postcss" global>
  .big-group {
    @apply max-w-sm;
    @apply w-full;
    @apply mx-auto;
  }
</style>
