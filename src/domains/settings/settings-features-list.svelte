<svelte:options runes={true} />

<script lang="ts">
  import { CloudUploadOutline, ContractOutline, ContrastOutline, HomeOutline, LocationOutline, LockClosedOutline, NotificationsOffOutline, TextOutline } from '../../components/icon/nicons'
  import capitalize from 'lodash/capitalize'
  import ListItem from '../../components/list-item/list-item.svelte'
  import ToggleSwitch from '../../components/toggle-switch/toggle-switch.svelte'

  import { Lang } from '../../store/lang'

  import { Interact } from '../../store/interact'

  import tick from '../../utils/tick/tick'

  import List from '../../components/list/list.svelte'
  import { Prefs, setDocumentTheme, type ThemeTypes } from '../preferences/Preferences'

  import Avatar from '../../components/avatar/avatar.svelte'
  import ButtonGroup from '../../components/button-group/button-group.svelte'
  import Button from '../../components/button/button.svelte'
  import { Device, setFontSize } from '../../store/device-store'
  import { openPinLock } from '../pin-lock/pin-helper'
  import { showToast } from '../../components/toast/ToastStore'
  import IonIcon from '../../components/icon/ion-icon.svelte'

  import AllBoardIcon from '../../n-icons/board-tab-icons/AllBoardIcon.svelte'
  import PeopleBoardIcon from '../../n-icons/board-tab-icons/PeopleBoardIcon.svelte'
  import ContextBoardIcon from '../../n-icons/board-tab-icons/ContextBoardIcon.svelte'
  import SelectPop from '../../select-pop/select-pop.svelte'
  import ExperimentBoardIcon from '../../n-icons/board-tab-icons/ExperimentBoardIcon.svelte'
  import IconSquare from '../../components/icon-square/icon-square.svelte'
  import { FeatureVisible, resolveExperience } from '../preferences/features'

  const themes: Array<ThemeTypes> = ['light', 'dark', 'auto']
  let hasPin: boolean = $state(false)

  $effect(() => {
    if ($Prefs.usePin) {
      hasPin = true
    }
  })

  let methods = {
    // settingChange() {
    //   UserStore.saveMeta()
    // },

    async lockToggle(change) {
      await tick(100)
      let shouldLock = change
      if (shouldLock === true) {
        hasPin = false
        let pin: any = await openPinLock({
          canClose: true,
          isMatch(pin) {
            return true
          },
        })
        if (!pin) {
          $Prefs.usePin = undefined
        } else {
          $Prefs.usePin = pin
          showToast({ message: '🔐 Pin Enabled' })
        }
      } else {
        let confirmDisable = await Interact.confirm(' Disable Pin?')
        if (confirmDisable) {
          $Prefs.usePin = undefined
          hasPin = false
          showToast({ message: '🔓 Pin Disabled' })
        }
      }
    },
  }
</script>

<List solo outside title="Customize">
  <!-- iOS look (guide 5.11): Experience is a segmented control with the explanation under it -->
  <div class="px-4 py-3 space-y-2">
    <div class="text-ios-subhead font-semibold text-ios-label">How much do you want to see?</div>
    <ButtonGroup
      value={resolveExperience($Prefs)}
      buttons={[
        { label: 'Starter', value: 'starter' },
        { label: 'Full', value: 'full' },
      ]}
      on:change={(evt) => {
        $Prefs.experience = evt.detail.value
      }}
    />
    <div class="text-ios-footnote text-ios-label2">
      {resolveExperience($Prefs) === 'full'
        ? 'Full shows everything. Switching never deletes data.'
        : 'Starter shows the essentials. Nothing is deleted.'}
    </div>
  </div>

  <ListItem bottomLine={57} title={Lang.t('settings.start-page', 'Start Page')}>
    <span slot="left"><IconSquare color="#6E3A96"><IonIcon icon={HomeOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <SelectPop
        id="start-page"
        value={capitalize($Prefs.startPage)}
        on:change={(evt) => {
          $Prefs.startPage = evt.detail.key
        }}
        options={['track', 'dashboard', 'goals', 'timeline', 'history'].map((t) => {
          return { key: t, value: capitalize(t), selected: $Prefs.startPage == t }
        })}
      />
      <!-- <select title="Select a Start Page" class="nselect clear" bind:value={$Prefs.startPage} on:change={(event) => {}}>
        <option value={'track'}>Track Tab</option>
        <option value={'dashboard'}>Dashboard</option>
        <option value={'goals'}>Goals</option>
        <option value={'timeline'}>Timeline</option>
        <option value={'history'}>History</option>
      </select> -->
    </div>
  </ListItem>

  <ListItem bottomLine={57} title={Lang.t('settings.use-location', 'Use Location')}>
    <span slot="left"><IconSquare color="#8944AB"><IonIcon icon={LocationOutline} size={17} /></IconSquare></span>
    <div slot="right" class="ml-2">
      <ToggleSwitch title="Location Lookup" bind:value={$Prefs.alwaysLocate} />
    </div>
  </ListItem>

  <!-- Pin Code -->
  <!-- description={Lang.t('settings.require-pin-description', "Don't forget it!")} -->
  <ListItem bottomLine={57} title={Lang.t('settings.require-pin', 'Require Access Pin')}>
    <span slot="left"><IconSquare color="#A066C0"><IonIcon icon={LockClosedOutline} size={17} /></IconSquare></span>
    <div slot="right" class="ml-2">
      {#if hasPin}
        <button
          class=" toggle-pin-button whitespace-nowrap text-primary-500 text-right"
          on:click={() => {
            methods.lockToggle(false)
          }}
        >
          {Lang.t('settings.disable', 'Disable Pin')}
        </button>
      {:else}
        <button
          class=" toggle-pin-button whitespace-nowrap text-primary-500 text-right"
          on:click={() => {
            methods.lockToggle(true)
          }}
        >
          {Lang.t('settings.set-pin', 'Set Lock Pin')}
        </button>
      {/if}
      <!-- <ToggleSwitch value={hasPin} on:change={methods.lockToggle} />
      {hasPin ? 'has pin' : 'has no pin'} -->
    </div>
  </ListItem>

  
</List>

<div class="mb-4" />
<List solo>
  <ListItem bottomLine={57} title={Lang.t('settings.theme', 'Theme')}>
    <span slot="left"><IconSquare color="#0A4F9E"><IonIcon icon={ContrastOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <SelectPop
        id="theme"
        on:change={(evt) => {
          $Prefs.theme = evt.detail.key
          setDocumentTheme($Prefs.theme)
        }}
        value={capitalize($Prefs.theme)}
        options={themes.map((theme) => {
          return {
            key: theme,
            value: capitalize(theme),
            selected: $Prefs.theme == theme,
          }
        })}
      />
      <!-- <ButtonGroup className="h-9" style="width:170px;">
        {#each themes as theme}
          <Button
            style="padding:0 10px !important;"
            color=""
            size="sm"
            className={`${$Prefs.theme === theme ? 'active' : ''}`}
            on:click={() => {
              $Prefs.theme = theme
              setDocumentTheme(theme)
            }}
          >
            {Lang.t(`theme.${theme}`)}
          </Button>
        {/each}
      </ButtonGroup> -->
    </div>
  </ListItem>

  <ListItem bottomLine={57} title={Lang.t('settings.font-size', 'Font Size')}>
    <span slot="left"><IconSquare color="#4A9BEA"><IonIcon icon={TextOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <ButtonGroup style="width:170px;">
        {#each ['xs', 'sm', 'md', 'lg', 'xl'] as size}
          <Button
            style="padding:0 10px !important;"
            id="font-size-{size}"
            color=""
            size="sm"
            className={`${$Device.fontSize === size ? 'active' : ''}`}
            on:click={() => {
              setFontSize(size)
            }}
          >
            {#if size == 'xs'}<div class="text-xs leading-7">A</div>{/if}
            {#if size == 'sm'}<div class="text-sm leading-7">A</div>{/if}
            {#if size == 'md'}<div class="text-base leading-7">A</div>{/if}
            {#if size == 'lg'}<div class="text-lg leading-7">A</div>{/if}
            {#if size == 'xl'}<div class="text-xl leading-7">A</div>{/if}
          </Button>
        {/each}
      </ButtonGroup>
    </div>
  </ListItem>
</List>

<div class="mb-4" />

<List solo>
  <ListItem bottomLine={57} title={Lang.t('settings.show-all-board', 'Show All Board')}>
    <span slot="left"><IconSquare color="#0A6CC9"><IonIcon icon={AllBoardIcon} size={16} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.allBoard} title="Toggle People Board" />
    </div>
  </ListItem>
  {#if $FeatureVisible('people-board')}
  <ListItem bottomLine={57} title={Lang.t('settings.show-people-board', 'Show People Board')}>
    <span slot="left"><IconSquare color="#0A6CC9"><IonIcon icon={PeopleBoardIcon} size={16} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.peopleBoard} title="Toggle People Board" />
    </div>
  </ListItem>
  {/if}
  {#if $FeatureVisible('context-board')}
  <ListItem bottomLine={57} title={Lang.t('settings.show-context-board', 'Show Context Board')}>
    <span slot="left"><IconSquare color="#0A6CC9"><IonIcon icon={ContextBoardIcon} size={16} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.contextBoard} title="Toggle Context Board" />
    </div>
  </ListItem>
  {/if}
  <!-- iOS look: teal icon square for the Experiments board -->
  <ListItem bottomLine={57} title="Show Experiments Board">
    <span slot="left"><IconSquare color="#0E7C86"><IonIcon icon={ExperimentBoardIcon} size={16} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch
        value={$Prefs.experimentBoard === true}
        title="Toggle Experiments Board"
        on:change={(evt) => {
          $Prefs.experimentBoard = evt.detail
        }}
      />
    </div>
  </ListItem>
</List>

<div class="mb-4" />
<List solo>
  <ListItem bottomLine={57} title={Lang.t('settings.small-tracker-buttons', 'Compact Trackers')}>
    <span slot="left"><IconSquare color="#6EB2F5"><IonIcon icon={ContractOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.compactTrackers} title="Compact Tracker Buttons" />
    </div>
  </ListItem>

  <ListItem bottomLine={57} title={Lang.t('settings.hide-backup-reminder', 'Hide Backup Reminder')}>
    <span slot="left"><IconSquare color="#636366"><IonIcon icon={CloudUploadOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.hideBackupMessage} title="Hide Backup Message" />
    </div>
  </ListItem>

  <ListItem bottomLine={57} title={Lang.t('settings.hide-message-notifications', 'Hide Message Alerts')}>
    <span slot="left"><IconSquare color="#6C6C70"><IonIcon icon={NotificationsOffOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <ToggleSwitch bind:value={$Prefs.hideMessages} title="Hide Nomie Messages" />
    </div>
  </ListItem>
</List>
