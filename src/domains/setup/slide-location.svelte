<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../store/lang'

  import Container from '../../components/container/container.svelte'
  import { Prefs } from '../../domains/preferences/Preferences'

  import Button from '../../components/button/button.svelte'
</script>

<Container className="filler  flex items-center justify-center  flex-col pt-3 px-5 slide-location -mt-8">
  <h1 class="mb-1 text-xl font-bold text-center leading-tight  text-ios-label">
    {Lang.t('setup.use-location-tracking', `Track Location?`)}
  </h1>
  <div
    class=" {$Prefs.alwaysLocate
      ? ''
      : 'opacity-50'}  px-4 mb-4 max-w-screen-md mx-auto text-sm leading-snug text-center text-ios-label2"
  >
    Save geo location data when tracking and journaling.
  </div>

  <div class="big-group p-2 bg-ios-card flex items-center shadow-lg rounded-2xl">
    <Button
      className="whitespace-no-wrap {!$Prefs.alwaysLocate
        ? 'bg-ios-tint text-ios-ontint font-bold'
        : 'bg-ios-card text-ios-label2'}"
      block
      size="lg"
      type="clear"
      delay={20}
      on:click={() => {
        $Prefs.alwaysLocate = false
      }}
    >
      Disabled
    </Button>
    <Button
      className="whitespace-nowrap {$Prefs.alwaysLocate
        ? 'bg-ios-tint text-ios-ontint font-bold'
        : 'bg-ios-card text-ios-label2'}"
      type="clear"
      block
      size="lg"
      delay={20}
      on:click={() => {
        $Prefs.alwaysLocate = true
      }}
    >
      Enabled
    </Button>
  </div>
  <!-- <NItem className="solod bg-ios-card  rounded-lg  shadow-sm mx-0 w-100">
      <div slot="left">
        <IonIcon icon={NavigateCircleOutline} className={$Prefs.alwaysLocate ? 'text-green-600' : 'text-ios-label2'} />
      </div>
      Track Location
      <div slot="right" class="ml-2">
        <NToggle bind:value={$Prefs.alwaysLocate} />
      </div>
    </NItem> -->
</Container>
