<svelte:options runes={true} />

<script lang="ts">
  import { LockClosedOutline } from '../../components/icon/nicons'
	import { LaunchCount } from './../preferences/LaunchCount.ts';
  import { navigate } from '../../vendor/svelte-navigator'

  import { Device } from '../../store/device-store'
  import { LedgerStore } from '../ledger/LedgerStore'
  import { Lang } from '../../store/lang'
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import { TrackableStore } from '../trackable/TrackableStore'
  import { TrackerStore } from '../tracker/TrackerStore'
  import { PeopleStore } from '../people/PeopleStore'
  import { ContextStore } from '../context/context-store'
  import { PointerStore } from '../pointers/pointer-store'
  import { LocationStore } from '../locations/LocationStore'
  import { PluginStore } from '../plugins/PluginStore'
  import { TemplateStore } from '../templates/templates-svelte-helpers'
  import { AwardStore } from '../awards/AwardsStore'
  import { openModal } from '../../components/backdrop/BackdropStore2'
  import WhatsNewModal from '../whats-new/whats-new-modal.svelte'
  import { openPrivacyPolicy } from '../../components/markdown-modal/MarkdownModalStore'
  import IconSquare from '../../components/icon-square/icon-square.svelte'
  import config from '../../config/appConfig'
  import { AppVersion } from '../../modules/app-version/app-version'
  import Badge from '../../components/badge/badge.svelte'
  import { BookOutline, ChatbubblesOutline, GlobeOutline, HelpCircleOutline, LanguageOutline } from '../../components/icon/nicons'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { ChevronDownOutline, ChevronUpOutline } from '../../components/icon/nicons'
  import { ExperimentStore } from '../experiments/ExperimentStore'
  import { GoalStore } from '../goals/GoalStore'

  let countsOpen = $state(false)

  let counts = $state({
    trackers: 0,
    people: 0,
    context: 0,
    pointers: 0,
    reminders: 0,
    locations: 0,
    plugins: 0,
    templates: 0,
    awards: 0,
    experiments: 0,
    goals: 0,
    runningExperiments: 0,
    total: 0,
  })

  // Items in the Counts section, not counting reminders (a subset of pointers) or running experiments (a subset of experiments)
  let totalCounted = $derived(
    counts.trackers +
      counts.people +
      counts.context +
      counts.pointers +
      counts.locations +
      counts.templates +
      counts.awards +
      counts.plugins +
      counts.experiments +
      counts.goals
  )

  $effect(() => {
    counts.goals = $GoalStore.length
    counts.experiments = $ExperimentStore.length
    counts.runningExperiments = $ExperimentStore.filter((e: any) => e.status === 'running').length
    counts.trackers = Object.keys($TrackerStore).length
    counts.context = Object.keys($ContextStore).length
    counts.pointers = $PointerStore.length
    counts.people = Object.keys($PeopleStore).length
    counts.total = Object.keys($TrackableStore).length
    counts.locations = $LocationStore.length
    counts.plugins = $PluginStore.length
    counts.templates = $TemplateStore.length
    counts.awards = $AwardStore.awards.length
    counts.reminders = $PointerStore.filter((pointer) => {
      return pointer.reminder == true
    }).length
  })
</script>

<List solo className=" mb-3" title={Lang.t('settings.learn-more', 'Learn More')} outside>
  <!-- <ListItem bottomLine={16} detail title="Frequently Asked Questions" to="/faq">
    <span slot="right" class="text-inverse-3">FAQ</span>
  </ListItem> -->
  <ListItem bottomLine={16} detail title="N6 Docs" href="https://www.dailynomie.com/%f0%9f%93%96-docs/">
    <span slot="left"><IconSquare color="#0A4F9E"><IonIcon icon={BookOutline} size={17} /></IconSquare></span>
    <span slot="right" class="text-inverse-3">Read</span>
  </ListItem>
  <ListItem bottomLine={16} detail title="Learn More" href="https://www.dailynomie.com">
    <span slot="left"><IconSquare color="#1F78D1"><IonIcon icon={GlobeOutline} size={17} /></IconSquare></span>
    <span slot="right" class="text-inverse-3">DailyNomie.com</span>
  </ListItem>

  <ListItem bottomLine={57} title="Privacy Policy" detail clickable on:click={() => openPrivacyPolicy()}>
    <span slot="left"><IconSquare color="#3A8EE6"><IonIcon icon={LockClosedOutline} size={17} /></IconSquare></span>
  </ListItem>

  <ListItem bottomLine={16} title="Reddit r/nomie" detail href="https://reddit.com/r/nomie">
    <span slot="left"><IconSquare color="#5BA3F0"><IonIcon icon={ChatbubblesOutline} size={17} /></IconSquare></span>
    <span slot="right" class="flex text-inverse-3">/r/nomie</span>
  </ListItem>
  <!-- Questions moved here from More's top section, so all the help and links are in one place -->
  <ListItem bottomLine={16} title={Lang.t('general.questions', 'Questions')} detail>
    <span slot="left"><IconSquare color="#7DB8F5"><IonIcon icon={HelpCircleOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <a href={`mailto:${config.support_email}?subject=Daily Nomie ${AppVersion} `}>
        <Badge pad className="bg-ios-fill text-ios-label">Email</Badge>
      </a>
    </div>
  </ListItem>

  <!-- The translation editor (/lang): help translating Nomie -->
  <ListItem bottomLine={16} title={Lang.t('settings.help-translate', 'Help translate Nomie')} detail clickable on:click={() => navigate('/lang')}>
    <span slot="left"><IconSquare color="#9CCBF8"><IonIcon icon={LanguageOutline} size={17} /></IconSquare></span>
  </ListItem>

  <!-- <ListItem title="Open Source" detail href="https://github.com/open-nomie/nomie">
    <span slot="right" class="flex text-inverse-3">GitHub</span>
  </ListItem> -->
</List>

<List solo className="mb-3" outside title="App">
  <ListItem bottomLine={16} title={Lang.t('general.first_log', 'First Log')}>
    <div class="" slot="right">
      {#await LedgerStore.getFirstDate(true)}
        Loading...
      {:then date}
        <div class="text-sm">{date.format('MMM YYYY')}</div>
      {/await}
      <!--  -->
    </div>
  </ListItem>
  <ListItem bottomLine={16} title={Lang.t('general.launch_count', 'Launch Count')}>
    <div class="" slot="right">
      {$LaunchCount}
    </div>
  </ListItem>

  <!-- <ListItem title={Lang.t('general.launch-count', 'Launch Count')}>
    <div class="flex" slot="right">
      <Button icon size="sm" on:click={UserStore.resetLaunchCount}>
        
      </Button>
      {$UserStore.launchCount}
    </div>
  </ListItem> -->
  <ListItem bottomLine={16} title={Lang.t('general.device', 'Device')}>
    <span slot="right">{$Device.device}</span>
  </ListItem>
  <ListItem bottomLine={16} title={Lang.t('general.platform', 'Platform')}>
    <span slot="right">{$Device.platform}</span>
  </ListItem>
  <ListItem bottomLine={16} title={Lang.t('general.pwa', 'PWA')}>
    <span slot="right">{$Device.pwa}</span>
  </ListItem>

  <!-- Counts is a section that opens and closes; the rows show when it is open -->
  <ListItem bottomLine={countsOpen ? 16 : undefined} clickable title="Counts" description="{totalCounted} items in total" on:click={() => (countsOpen = !countsOpen)}>
    <div slot="right"><IonIcon icon={countsOpen ? ChevronUpOutline : ChevronDownOutline} size={16} /></div>
  </ListItem>
  {#if countsOpen}
    <ListItem bottomLine={16} title="Trackers">
      <div slot="right">{counts.trackers}</div>
    </ListItem>
    <ListItem bottomLine={16} title="People">
      <div slot="right">{counts.people}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Context">
      <div slot="right">{counts.context}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Pointers">
      <div slot="right">{counts.pointers}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Reminders">
      <div slot="right">{counts.reminders}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Locations">
      <div slot="right">{counts.locations}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Templates">
      <div slot="right">{counts.templates}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Awards">
      <div slot="right">{counts.awards}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Plugins">
      <div slot="right">{counts.plugins}</div>
    </ListItem>
    <ListItem bottomLine={16} title="Experiments" description="{counts.runningExperiments} running">
      <div slot="right">{counts.experiments}</div>
    </ListItem>
    <ListItem title="Goals">
      <div slot="right">{counts.goals}</div>
    </ListItem>
  {/if}
</List>

<List solo title="Version" outside className="mb-3">
  <ListItem
    bottomLine={16}
    title="Version {import.meta.env.PACKAGE_VERSION} "
    detail
    on:click={() => {
      openModal({
        id: 'whats-new',
        component: WhatsNewModal,
        position: 'bottom',
      })
    }}
  >
    <span slot="right" class="flex text-sm text-ios-tint"> What's New </span>
  </ListItem>
  <ListItem
    detail
    title="Onboarded"
    on:click={() => {
      navigate('/setup')
    }}
  >
    <span slot="right" class="text-sm text-ios-tint">
      {Lang.t('settings.redo-setup', 'Redo Setup')}
    </span>
  </ListItem>
</List>
