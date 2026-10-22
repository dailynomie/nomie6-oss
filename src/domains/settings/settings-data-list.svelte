<svelte:options runes={true} />

<script lang="ts">
  import FeatureBadge from '../../components/advanced-badge/feature-badge.svelte'
  import {
    DocumentTextOutline,
    FolderOutline,
    RefreshOutline,
    TimeOutline,
    TrashOutline,
  } from '../../components/icon/nicons'
  import { ServerOutline } from '../../components/icon/nicons'
  import { useStorageSelectMenu } from './settings-functions'

  import ListItem from '../../components/list-item/list-item.svelte'
  import { Lang } from '../../store/lang'

  // import PouchDBOptions from '@/components/storage/pouchdb.svelte'

  import List from '../../components/list/list.svelte'

  import { navigate } from '../../vendor/svelte-navigator'

  import { Prefs, saveStorageType } from '../preferences/Preferences'
  import { FeatureVisible } from '../preferences/features'
  import { wait } from '../../utils/tick/tick'
  import { Device } from '../../store/device-store'
  import { Interact } from '../../store/interact'
  import Divider from '../../components/divider/divider.svelte'

  import { TrackableStore } from '../trackable/TrackableStore'

  import { updateAllLastUsed } from '../usage/UsageStore'
  import PouchdbSettings from '../storage/engines/pouchdb/pouchdb.svelte'
  import { getStorageEngineDetails, type StorageEngineType } from '../storage/storage'

  import { showImportModal } from '../import-export/ImporterStore'
  import { showToast } from '../../components/toast/ToastStore'

  import BackupListItems from '../../components/backup-message/backup-list-items.svelte'
  import { generateBackup } from '../backup/BackupStore'
  import NomieServer from '../storage/engines/nomie-server/nomie-server.svelte'
  import { openModal } from '../../components/backdrop/BackdropStore2'
  import PluginDedupModal from '../plugins/plugin-dedup-modal.svelte'
  import SelectPop from '../../select-pop/select-pop.svelte'
  import { autoCleanupPlugins } from '../plugins/PluginCleanupStore'
  import IconSquare from '../../components/icon-square/icon-square.svelte'
  import { HelpCircleOutline } from '../../components/icon/nicons'
  import { openUnknownTrackables } from '../trackable/unknown-trackables-store'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { DownloadOutline } from '../../components/icon/nicons'

  // let fileInputF
  // let showImporter = false

  // const dispatch = createEventDispatcher()

  const updateLastUsedDates = async () => {
    const confirmed = await Interact.confirm(
      'Update all streaks and last used data?',
      `Depending on how much you track, this can take a while.`
    )
    if (confirmed) {
      await wait(100)
      Interact.blocker('Analyzing Usage Data...')
      await updateAllLastUsed($TrackableStore.trackables)
      Interact.stopBlocker()
      showToast({ message: Lang.t('settings.update-complete', 'Update Complete') })
    }
  }

  const openPluginDedupModal = () => {
    openModal({
      id: 'plugin-dedup-modal',
      component: PluginDedupModal,
      componentProps: {},
    })
  }

  let pluginCleanupDays = $state($Prefs.pluginCleanupDays || -1)
  let previousCleanupDays = $state(-1)

  $effect(() => {
    if ($Prefs.pluginCleanupDays !== undefined) {
      pluginCleanupDays = $Prefs.pluginCleanupDays
    }
  })

  const handleCleanupScheduleChange = async (newDays: number) => {
    const wasDisabled = previousCleanupDays === -1
    const isNowEnabled = newDays !== -1

    if (wasDisabled && isNowEnabled) {
      console.info('[Settings] Cleanup enabled - running initial scan')
      await autoCleanupPlugins()
    }

    previousCleanupDays = newDays
  }

  let cleanupOptions = $derived([
    {
      key: -1,
      value: 'Never',
      selected: `${pluginCleanupDays}` == '-1',
    },
    {
      key: 1,
      value: 'Daily',
      selected: `${pluginCleanupDays}` == '1',
    },
    {
      key: 3,
      value: 'Every Few Days',
      selected: `${pluginCleanupDays}` == '3',
    },
    {
      key: 7,
      value: 'Weekly',
      selected: `${pluginCleanupDays}` == '7',
    },
    {
      key: 14,
      value: 'Every Other Week',
      selected: `${pluginCleanupDays}` == '14',
    },
    {
      key: 30,
      value: 'Monthly',
      selected: `${pluginCleanupDays}` == '30',
    },
  ])

  let selectedCleanupLabel = $derived((cleanupOptions.find((s) => s.selected) || {}).value)

  const showStorageOptions = () => {
    useStorageSelectMenu({
      current: $Prefs.storageType,
      async onSelect(storage: any) {
        const confirmed = await Interact.confirm(
          'Switch storage?',
          'You can always switch back. No data is shared between storage types.'
        )

        if (confirmed) {
          saveStorageType(storage)
          await wait(500)
          Device.reload()
        }
      },
    })
  }

  let storageDetails = $derived(getStorageEngineDetails($Prefs.storageType))
</script>

<List solo className="mb-4" title={Lang.t('settings.my-data', 'My Data')} outside>
  <!-- <Button clear primary slot="header-right" on:click={showStorageOptions}>
    {storageDetails.shortName}
    <IonIcon icon={ChevronDownOutline} size={14} className="ml-2 text-ios-label" />
  </Button> -->
  <ListItem on:click={showStorageOptions} detail bottomLine={57}>
    <span slot="left">
      <IconSquare color="#0B4F55"><IonIcon icon={ServerOutline} size={17} /></IconSquare>
    </span>
    <div class="leading-tight">{Lang.t('settings.stored-on', { name: storageDetails.name })}</div>
    <div class="text-xs text-ios-label2 line-clamp-2 leading-tight mt-1">{storageDetails.description}</div>
  </ListItem>
  {#if $Prefs.storageType === 'pouchdb'}
    <Divider left={32} />
    <PouchdbSettings />
  {/if}
  {#if $Prefs.storageType === 'nomie-server'}
    <Divider left={32} />
    <NomieServer />
  {/if}
</List>

<!-- {#if $Prefs.storageType === 'local'}
  <p class="list-note -mt-2">
    Want your Nomie data multiple devices? Switch to Nomie Cloud, and for a small fee, your data will be stored fully
    encrypted, in the cloud.
  </p>
{/if} -->

<BackupListItems onGenerate={generateBackup} />

<List solo className="mb-3 mt-4" outside>
  <ListItem
    bottomLine={57}
    detail
    title={Lang.t('general.import-data', 'Import Data')}
    on:click={() => {
      showImportModal()
    }}
  >
    <span slot="left"><IconSquare color="#0E7C86"><IonIcon icon={DownloadOutline} size={17} /></IconSquare></span>
    <div slot="right" class="opacity-50 text-sm">{Lang.t('settings.csv-or-nomie-backup', 'CSV or Nomie Backup')}</div>
  </ListItem>

  {#if $FeatureVisible('csv')}
    <ListItem bottomLine={57} detail title={Lang.t('settings.download-csv', 'Download CSV')} to="/settings/export/csv">
      <span slot="left" class="adv-corner"
        ><IconSquare color="#2A8E97"><IonIcon icon={DocumentTextOutline} size={17} /></IconSquare><FeatureBadge
          feature="csv"
        /></span
      >
    </ListItem>
  {/if}
</List>
<List solo className="mb-3" outside>
  {#if $FeatureVisible('files')}
    <ListItem
      bottomLine={57}
      detail
      title={Lang.t('general.browse-files', 'Browse Files')}
      on:click={() => {
        navigate('/files')
      }}
    >
      <span slot="left" class="adv-corner"
        ><IconSquare color="#3FA0A9"><IonIcon icon={FolderOutline} size={17} /></IconSquare><FeatureBadge
          feature="files"
        /></span
      >
    </ListItem>
  {/if}

  <ListItem
    bottomLine={57}
    detail
    clickable
    title={Lang.t('settings.update-last-used-date', 'Update Last-Used Dates')}
    on:click={updateLastUsedDates}
  >
    <span slot="left"><IconSquare color="#5CB3BB"><IonIcon icon={RefreshOutline} size={17} /></IconSquare></span>
  </ListItem>

  <!-- iOS look (Ronald request): tags in notes that have no trackable yet -->
  <ListItem
    bottomLine={57}
    detail
    clickable
    title={Lang.t('settings.manage-unknown-trackables', 'Manage Unknown Trackables')}
    description={Lang.t(
      'settings.tags-in-your-notes-that-have-no-tracker-yet',
      'Tags in your notes that have no tracker yet'
    )}
    on:click={openUnknownTrackables}
  >
    <span slot="left"><IconSquare color="#68BDC4"><IonIcon icon={HelpCircleOutline} size={17} /></IconSquare></span>
  </ListItem>

  <ListItem
    bottomLine={57}
    detail
    clickable
    title={Lang.t('settings.clean-plugin-database', 'Clean Plugin Database')}
    description={Lang.t(
      'settings.find-and-remove-duplicate-plugin-settings',
      'Find and remove duplicate plugin settings'
    )}
    on:click={openPluginDedupModal}
  >
    <span slot="left"><IconSquare color="#7CC4CB"><IonIcon icon={TrashOutline} size={17} /></IconSquare></span>
  </ListItem>

  <ListItem
    bottomLine={57}
    title={Lang.t('settings.auto-cleanup', 'Auto Cleanup')}
    description={Lang.t(
      'settings.removes-duplicate-plugin-settings-on-a-schedule',
      'Removes duplicate plugin settings on a schedule'
    )}
  >
    <span slot="left"><IconSquare color="#9AD3D8"><IonIcon icon={TimeOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <SelectPop
        id="plugin-cleanup-schedule"
        value={selectedCleanupLabel}
        on:change={(evt) => {
          $Prefs.pluginCleanupDays = evt.detail.key
          handleCleanupScheduleChange(evt.detail.key)
        }}
        options={cleanupOptions}
      />
    </div>
  </ListItem>
</List>
<!-- 
<List transparent className=" px-2" outside title={Lang.t('settings.import-export', 'Import / Export')}>
  <p slot="subheader" class="list-note -mt-2">
    Exporting will back-up all of your Nomie data into a single JSON file, that can be imported later.
  </p>
  <div class="p-2 grid grid-cols-2 gap-2">
    
    <Button
      role="menuitem"
      
      className="bg-ios-card text-ios-label"
      title={`${Lang.t('settings.import', 'Import')}`}
      on:click={() => {
        showImportModal()
      }}
    >
      <IonIcon icon={DownloadOutline} className="mr-2" size={20} /> {Lang.t('settings.import', 'Import')}</Button
    >
    
    <Button
      role="menuitem"
      
      className="bg-ios-card text-ios-label"
      title={Lang.t('settings.export', 'Export')}
      on:click={() => generateBackup()}
    >
      <IonIcon icon={ShareOutline} className="mr-2" size={20} />
      {Lang.t('settings.export', 'Export')}
    </Button>
  </div>
</List> -->

<!-- {#if $Prefs.storageType === 'firebase'}
  <List solo>
    <ListItem
      detail
      clickable
      title={Lang.t('settings.log-cache', 'Log Cache')}
      description="Did you lose some data? Check the Log cache, a backup copy of your note might be in there."
      on:click={openLogCacheModal}
    />
  </List>
{/if} -->
