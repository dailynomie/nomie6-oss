<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Button from '../../components/button/button.svelte'
  import Text from '../../components/text/text.svelte'
  import List from '../../components/list/list.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import Divider from '../../components/divider/divider.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { CircleOutline, CheckmarkCircle } from '../../components/icon/nicons'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { Interact } from '../../store/interact'
  import { showToast } from '../../components/toast/ToastStore'

  import type { DedupResult } from './plugin-dedup'
  import { scanForPluginDuplicates, cleanupPluginDuplicates } from './plugin-dedup'
  import type { CleanupLogEntry } from './PluginCleanupStore'
  import { getLastCleanupLog, saveCleanupLog } from './PluginCleanupStore'
  import dayjs from 'dayjs'
  import { getDateFormats } from '../preferences/Preferences'
  import { Lang } from '../../store/lang'

  const id = 'plugin-dedup-modal'

  let isScanning = $state(false)
  let isLoading = $state(false)
  let scanResult: DedupResult | null = $state(null)
  let hasScanned = $state(false)
  let lastCleanupLog = $state<CleanupLogEntry | null>(null)

  // Load cleanup log when modal opens or when component mounts
  const loadCleanupLog = () => {
    lastCleanupLog = getLastCleanupLog()
  }

  // Initial load
  loadCleanupLog()

  const handleScan = async () => {
    isScanning = true
    try {
      scanResult = await scanForPluginDuplicates()
      hasScanned = true
    } catch (e) {
      console.error('Scan error:', e)
      showToast({
        message: Lang.t('plugins.error-scanning-for-duplicates', 'Error scanning for duplicates'),
        type: Lang.t('plugins.error-2', 'error'),
      })
    } finally {
      isScanning = false
    }
  }

  const handleCleanup = async () => {
    const confirmed = await Interact.confirm(
      'Clean Plugin Database?',
      `This will remove ${scanResult?.totalDuplicateEntries} duplicate plugin entries. This action cannot be undone.`,
      'Clean'
    )

    if (!confirmed) return

    isLoading = true
    try {
      Interact.blocker('Cleaning plugin database...')
      const result = await cleanupPluginDuplicates()
      Interact.stopBlocker()
      saveCleanupLog(result, 'manual')
      loadCleanupLog()
      showToast({
        message: Lang.t('plugins.plugin-database-cleaned-successfully', 'Plugin database cleaned successfully'),
      })
      scanResult = null
      hasScanned = false
      setTimeout(() => {
        closeModal(id)
      }, 500)
    } catch (e) {
      console.error('Cleanup error:', e)
      Interact.stopBlocker()
      showToast({
        message: Lang.t('plugins.error-cleaning-plugin-database', 'Error cleaning plugin database'),
        type: Lang.t('plugins.error-2', 'error'),
      })
    } finally {
      isLoading = false
    }
  }

  const handleClose = () => {
    closeModal(id)
  }
</script>

<BackdropModal {id}>
  <header slot="header">
    <ToolbarGrid>
      <Button slot="left" clear primary on:click={handleClose}>{Lang.t('plugins.cancel', 'Cancel')}</Button>
      <Text bold slot="main" className="text-ios-label"
        >{Lang.t('plugins.clean-plugin-database', 'Clean Plugin Database')}</Text
      >
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4">
    {#if !hasScanned}
      <div class="info-box p-4 rounded-lg">
        <Text bold className="text-ios-label mb-2">{Lang.t('plugins.what-this-does', 'What This Does')}</Text>
        <Text className="text-ios-label2" size="sm">
          {Lang.t(
            'plugins.plugins-are-created-by-different-developers-and-',
            "Plugins are created by different developers and may store data differently. Over time, duplicate entries can accumulate in your plugin database—especially if you've synced data across devices."
          )}
        </Text>
        <Text className="text-ios-label2 mt-2" size="sm">
          {Lang.t(
            'plugins.this-tool-safely-removes-these-duplicates-and-cl',
            'This tool safely removes these duplicates and cleans up orphaned plugin folders. Your actual plugins and their functionality are never affected—only the background storage is tidied up.'
          )}
        </Text>
        <Text className="text-ios-label2 mt-2" size="sm">
          {Lang.t(
            'plugins.no-changes-are-made-until-you-confirm-you-can-al',
            'No changes are made until you confirm. You can always scan again to verify the results.'
          )}
        </Text>
      </div>

      {#if lastCleanupLog}
        <div class="last-cleanup-box p-3 rounded-lg bg-ios-card">
          <Text bold size="sm" className="text-ios-label mb-1">{Lang.t('plugins.last-cleanup', 'Last Cleanup')}</Text>
          <Text size="xs" className="text-ios-label">
            {dayjs(lastCleanupLog.date).format(`${getDateFormats().mmm_d_yyyy} ${getDateFormats().time}`)} ({lastCleanupLog.type})
          </Text>
          <Text size="xs" className="text-ios-label2 mt-1">
            {Lang.t('plugins.cleanup-found', {
              duplicates: lastCleanupLog.duplicatesFound,
              duplicateWord: Lang.t(lastCleanupLog.duplicatesFound === 1 ? 'plugins.duplicate' : 'plugins.duplicates'),
              folders: lastCleanupLog.rogueFoldersFound,
              folderWord: Lang.t(
                lastCleanupLog.rogueFoldersFound === 1 ? 'plugins.rogue-folder' : 'plugins.rogue-folders'
              ),
            })}
          </Text>
        </div>
      {/if}

      <Button primary on:click={handleScan} disabled={isScanning}>
        {isScanning
          ? Lang.t('plugins.scanning', 'Scanning...')
          : Lang.t('plugins.scan-for-duplicates', 'Scan for Duplicates')}
      </Button>
    {:else if scanResult}
      {#if scanResult.hasDuplicates}
        <div class="duplicate-alert p-4 rounded-lg flex gap-3 bg-ios-card">
          <div class="flex-shrink-0">
            <IonIcon icon={CircleOutline} className="text-ios-label2" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-ios-label">
              {Lang.t(
                scanResult.totalDuplicateEntries + scanResult.totalRogueFolders === 1
                  ? 'plugins.count-issue-found'
                  : 'plugins.count-issues-found',
                { num: scanResult.totalDuplicateEntries + scanResult.totalRogueFolders }
              )}
            </Text>
            <Text size="sm" className="text-ios-label2">
              {#if scanResult.totalDuplicateEntries > 0}
                {Lang.t(
                  scanResult.totalDuplicateEntries === 1 ? 'plugins.duplicate-entry' : 'plugins.duplicate-entries',
                  { num: scanResult.totalDuplicateEntries }
                )}
              {/if}
              {#if scanResult.totalRogueFolders > 0}
                {#if scanResult.totalDuplicateEntries > 0}
                  •
                {/if}
                {Lang.t(
                  scanResult.totalRogueFolders === 1 ? 'plugins.rogue-folder-count' : 'plugins.rogue-folders-count',
                  { num: scanResult.totalRogueFolders }
                )}
              {/if}
            </Text>
          </div>
        </div>

        <div class="mt-4">
          <Text bold className="text-ios-label mb-2">{Lang.t('plugins.issues-found', 'Issues Found:')}</Text>
          <List transparent>
            {#each scanResult.pluginIssues as issue (issue.pluginId + issue.issueType)}
              <ListItem bottomLine={16}>
                <div slot="left" class="text-lg">
                  {#if issue.issueType === 'duplicates-in-file'}
                    ⚠️
                  {:else if issue.issueType === 'rogue-folder'}
                    🗑️
                  {/if}
                </div>
                <div class="flex-grow">
                  <Text bold className="text-ios-label">
                    {issue.pluginName}
                  </Text>
                  <Text size="sm" className="text-ios-label2">
                    {#if issue.issueType === 'duplicates-in-file'}
                      {Lang.t(issue.duplicatesFound === 1 ? 'plugins.duplicate-entry' : 'plugins.duplicate-entries', {
                        num: issue.duplicatesFound,
                      })}
                    {:else if issue.issueType === 'rogue-folder'}
                      {Lang.t('plugins.orphaned-folder', 'Orphaned plugin folder (not in plugins.json)')}
                    {/if}
                  </Text>
                  <Text size="xs" className="text-ios-label2 mt-1">
                    {issue.fileLocation}
                  </Text>
                </div>
              </ListItem>
            {/each}
          </List>
        </div>

        <div class="mt-6 space-y-2">
          <Button primary on:click={handleCleanup} disabled={isLoading}>
            {isLoading ? Lang.t('plugins.cleaning', 'Cleaning...') : Lang.t('plugins.clean-database', 'Clean Database')}
          </Button>
          <Button
            clear
            on:click={() => {
              scanResult = null
              hasScanned = false
            }}
          >
            {Lang.t('plugins.scan-again', 'Scan Again')}
          </Button>
        </div>
      {:else}
        <div class="success-box p-4 rounded-lg flex gap-3 bg-ios-goodsoft">
          <div class="flex-shrink-0">
            <IonIcon icon={CheckmarkCircle} className="text-ios-good" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-ios-good">{Lang.t('plugins.no-issues-found', 'No Issues Found')}</Text>
            <Text size="sm" className="text-ios-good">
              {Lang.t('plugins.db-clean', {
                num: scanResult.totalPluginsInMainList,
                word: Lang.t(scanResult.totalPluginsInMainList === 1 ? 'plugins.plugin' : 'plugins.plugins'),
              })}
            </Text>
          </div>
        </div>

        <Button
          clear
          on:click={() => {
            handleScan()
          }}
        >
          {Lang.t('plugins.scan-again', 'Scan Again')}
        </Button>
      {/if}
    {/if}
  </main>
</BackdropModal>

<style lang="postcss">
  /* iOS look: notices are cards (info and caution, with a glyph); success is the good soft fill; dark mode follows the tokens */
  :global(.info-box),
  :global(.last-cleanup-box),
  :global(.duplicate-alert) {
    background-color: var(--ios-card);
  }

  :global(.success-box) {
    background-color: var(--ios-good-soft);
  }
</style>
