<svelte:options runes={true} />

<script lang="ts">
  import { HelpCircleOutline, CopyOutline, }DocumentTextOutline, ExtensionPuzzleOutline, LocationOutline, PricetagOutline } from '../../components/icon/nicons'
  import { navigate } from '../../vendor/svelte-navigator'

  import SettingsTweakList from './settings-tweak-list.svelte'

  import Container from '../../components/container/container.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'

  //Vendors

  import SocialShare from '../../modules/share/share'

  // Components
  import ListItem from '../../components/list-item/list-item.svelte'
  import Spacer from '../../components/spacer/spacer.svelte'
  import List from '../../components/list/list.svelte'

  // // Containers

  import NLayout from '../../domains/layout/layout.svelte'

  // Vendors
  import dayjs from 'dayjs'

  // Stores

  import { Interact } from '../../store/interact'

  import { Lang } from '../../store/lang'
  import { Device } from '../../store/device-store'

  // Config
  import config from '../../config/appConfig'
  // Comtainers

  // Components
  import Text from '../../components/text/text.svelte'

  import SettingsDataList from './settings-data-list.svelte'
  import SettingsAboutList from './settings-about-list.svelte'
  import SettingsFeaturesList from './settings-features-list.svelte'
  import SettingsAIList from './settings-ai-list.svelte'
  import { AppVersion } from '../../modules/app-version/app-version'

  import AwardsPreviewList from '../awards/components/awards-preview-list.svelte'
  import { enabledBetaFeatures, Prefs } from '../preferences/Preferences'
  import { FeatureVisible } from '../preferences/features'
  import { showImportModal } from '../import-export/ImporterStore'
  import { deleteEverything } from './settings-functions'
  // import Logo from '../../components/logo/logo.svelte'
  import { showToast } from '../../components/toast/ToastStore'

  import ChatboxOutline from '../../n-icons/ChatboxOutline.svelte'
  import Badge from '../../components/badge/badge.svelte'
  import { openTemplateManager } from '../templates/templates-svelte-helpers'
  // import { openAnalytics } from '../templates/templates-svelte-helpers'
  // import { openAfterNomie } from '../templates/templates-svelte-helpers'
  import { openPluginsModal } from '../plugins/PluginStore'
  import { openPointersModal } from '../pointers/pointer-store'
  import PluginsMoreMenu from '../plugins/plugins-more-menu.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import ChevronUpOutline from '../../n-icons/ChevronUpOutline.svelte';

  import ChevronDownOutline from '../../n-icons/ChevronDownOutline.svelte'
  import { openLocationModal } from '../locations/LocationStore'
  import IconSquare from '../../components/icon-square/icon-square.svelte'

  const location = undefined
  const style = undefined

  let st = $state(0)
  let showplugins = $state(false)
  async function specialTap() {
    st = st + 1
    if (st > 9) {
      methods.unlockFeatures()
    }
  }

  const toggleshowplugins = () => {
    if (showplugins) {showplugins = false}
    else {showplugins = true}
  }

  let methods = {
    share() {
      SocialShare(
        `I track my life with Nomie! It's free, private, and you get to design what you track. @nomieapp`,
        'https://nomie.app'
      )
    },
    async unlockFeatures() {
      enabledBetaFeatures()
      Interact.confetti({
        show: true,
      })
      showToast({
        type: 'success',
        message: '🎁  Secret Beta Features Unlocked',
      })
    },
    locations() {
      Interact.pickLocation()
    },

    bookAge(date) {
      return dayjs(`${date}-01`).fromNow()
    },
    faq() {
      navigate('/faq')
    },
    shop() {
      navigate('/shop')
    },
  }

  $effect(() => {
    Device.scrollToTop()
  })
</script>

<NLayout pageTitle="Settings" showCapture={false}>
  <div slot="header" class="z-40">
    <Container>
      <ToolbarGrid>
        <!-- <Button
          slot="left"
          clear
          icon
          title={Lang.t('general.messages', 'Messages')}
          className={$Prefs.hideMessages ? 'hidden' : ''}
          on:click={() => {
            navigate('/messages')
          }}
        >
          <IonIcon
            icon={$MessageStore.unseen ? MailUnreadOutline : MailOutline}
            className={$MessageStore.unseen ? 'text-red-500 animate-pulse' : 'text-gray-500'}
          />
        </Button> -->

        <!-- <Logo size={22} /> -->

        <span slot="left" title="Daily Nomie 7" class="rounded-full bg-primary-500 text-white text-xs font-bold px-2 py-0.5 leading-none">v7</span>

        <div slot="right">
          <!-- {#if !hasChatInstalled} -->
          <a
            title="Find a bug? Want to provide feedback?"
            href={`mailto:${config.support_email}?subject=Daily Nomie ${AppVersion} `}
            class="font-semibold text-black dark:text-white text-sm flex items-center space-x-2"
            target="_blank"
          >
            <span>{Lang.t('general.feedback', 'Feedback')}</span>
            <ChatboxOutline />
          </a>
          <!-- {/if} -->
        </div>
      </ToolbarGrid>
      <!-- iOS look (guide 5.11): large title "More" -->
      <h1 class="text-ios-large font-bold text-ios-label px-4 mt-1">More</h1>
    </Container>
  </div>

  <div slot="content" class="pt-2 z-10 relative  lg:px-4">
    <Container>
      {#if $Prefs}
        <div class="page page-settings">
          <div class="p-0 pt-4">
            <div id="settings-marker" />

            <!-- <ListItem bottomLine={16} transparent>
              <div class="grid grid-cols-2 gap-2">
                <Button
                  role="menuitem"
                  className="dark:bg-gray-800 bg-gray-100 text-black dark:text-white"
                  title={`${Lang.t('settings.sign-in', 'Sign-In')}`}
                  on:click={() => {
                    openLoginModal()
                  }}
                >
                  {Lang.t('settings.sign-in', 'Sign-In')}</Button
                >
                <Button
                  role="menuitem"
                  className="dark:bg-gray-800 bg-gray-100 text-black dark:text-white"
                  title={Lang.t('settings.export', 'Export')}
                  on:click={() => openRegisterModal()}
                >
                  {Lang.t('settings.register', 'Register')}
                </Button>
              </div>
            </ListItem> -->

            <List solo outside>
              <AwardsPreviewList />
            </List>

            <!-- Sign-in and Register Block  -->
            <!-- iOS look (guide 5.11): Advanced is one group in Full mode: Plugins and CSV -->
            {#if $FeatureVisible('plugins')}
            <List solo outside title="Advanced" className="mt-4">
              <ListItem detail bottomLine={57} on:click={() => openPluginsModal()} title="Manage Plugins">
                <span slot="left"><IconSquare color="#C25E00"><IonIcon icon={ExtensionPuzzleOutline} size={17} /></IconSquare></span>
              </ListItem>
              <ListItem clickable on:click={toggleshowplugins}>
                <span slot="left"><IconSquare color="#C25E00"><IonIcon icon={ExtensionPuzzleOutline} size={17} /></IconSquare></span>
                <div slot="right">
                  {#if showplugins}
                    <span><IonIcon icon={ChevronUpOutline} size={16} /></span>
                  {:else}
                  <span><IonIcon icon={ChevronDownOutline} size={16} /></span>
                  {/if}
                </div>
                <div class="font-semibold leading-tight">Show Plugins</div>
                <div class="text-xs text-gray-500 line-clamp-2 leading-tight mt-1">Click to show or hide the installed Plugins</div>
              </ListItem>
              {#if showplugins}
              <PluginsMoreMenu />
              {/if}
            </List>
            {/if}

            <!-- CSV is its own row group, separate from the plugin rows -->
            {#if $FeatureVisible('csv')}
              <List solo className="mt-4">
                <ListItem detail bottomLine={57} title={Lang.t('settings.download-csv', 'Download CSV')} to="/settings/export/csv">
                  <span slot="left"><IconSquare color="#8E8E93"><IonIcon icon={DocumentTextOutline} size={17} /></IconSquare></span>
                </ListItem>
              </List>
            {/if}

            <List solo className="mt-4">
              <ListItem detail bottomLine={57} on:click={() => openLocationModal()} title="Locations">
                <span slot="left"><IconSquare color="#3634A3"><IonIcon icon={LocationOutline} size={17} /></IconSquare></span>
              </ListItem>
            </List>
            
            <List solo className="mt-4">
              <ListItem detail bottomLine={57} on:click={() => openPointersModal()} title="Pointers">
                <span slot="left"><IconSquare color="#4B48B8"><IonIcon icon={PricetagOutline} size={17} /></IconSquare></span>
              </ListItem>
              </List>

            <List solo className="mt-4">
              <ListItem detail bottomLine={57} on:click={() => openTemplateManager()} title="Templates">
                <span slot="left"><IconSquare color="#636366"><IonIcon icon={CopyOutline} size={17} /></IconSquare></span>
              </ListItem>
            </List>

            <!-- <List solo className="mt-4">
              <ListItem detail bottomLine={16} on:click={() => openAnalytics()} title="Analytics">
                <span slot="left">🧊</span>
              </ListItem>
            </List> -->

            <!-- <List solo className="mt-4">
              <ListItem detail bottomLine={16} on:click={() => openAfterNomie()} title="AfterNomie">
                <span slot="left">䷾</span>
              </ListItem>
            </List> -->

            {#if $FeatureVisible('ai')}
              <SettingsAIList />
            {/if}

            <div id="data-marker" />
            <SettingsDataList
              on:showImporter={() => {
                showImportModal()
              }}
            />

            <SettingsFeaturesList />
            <SettingsTweakList />

            <!-- END Views -->

            <List solo className="mt-4">
              <ListItem title={Lang.t('general.questions', 'Questions')} detail>
                <span slot="left"><IconSquare color="#636366"><IonIcon icon={HelpCircleOutline} size={17} /></IconSquare></span>
                <div slot="right">
                  <a href={`mailto:${config.support_email}?subject=Daily Nomie ${AppVersion} `}>
                    <Badge pad className="bg-gray-300 text-black">Email</Badge>
                  </a>
                </div>
              </ListItem>
            </List>

            <div id="about-marker" />
            <SettingsAboutList />

            <Spacer gap={1} />

            <!-- iOS look: footer, centred, 13 px secondary, 24 px above -->
            <button class="w-full px-4 mt-6 mb-3 text-center text-ios-footnote text-ios-label2" on:click={specialTap}>
              <div>Daily Nomie {import.meta.env.PACKAGE_VERSION}</div>
              <div>Copyright 2014 - {dayjs().format('YYYY')}</div>
            </button>
          </div>
          <!-- end container -->
        </div>
      {/if}

      <List solo className="mb-3" outside title={Lang.t('settings.danger-zone', 'Danger Zone')}>
        <ListItem detail on:click={deleteEverything} clickable>
          <Text className="text-red">
            {Lang.t('settings.destroy-all-data', 'Destroy all Data')}
          </Text>
        </ListItem>
      </List>
    </Container>
  </div>
</NLayout>

<style global lang="postcss">
  body[data-path='/settings'] .woot--bubble-holder {
    @apply block;
  }

  body[data-path='/settings'] .woot-widget-bubble img {
    /* @apply h-4 w-4;
    z-index:300 !important;
    @apply my-0 mx-2; */
    @apply hidden;
  }

  body[data-path='/settings'] .woot-widget-bubble:before {
    content: 'Need Help? 🛟';
  }
  body .woot-widget-bubble {
    height: 32px !important;
    width: auto !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center;
    background: transparent !important;
    @apply text-black dark:text-white;
    box-shadow: none !important;
    flex-wrap: nowrap;
    border-radius: 9900px;
    @apply px-2;
    @apply top-2;
    @apply -right-2;
    @apply -mr-2;
    @apply bottom-auto;
    padding-left: 10px !important;
  }
  body .woot-widget-bubble img {
  }
  body .woot-widget-bubble:hover {
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1) !important;
  }
</style>
