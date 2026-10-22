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
      showToast({ message: 'Error scanning for duplicates', type: 'error' })
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
      showToast({ message: 'Plugin database cleaned successfully' })
      scanResult = null
      hasScanned = false
      setTimeout(() => {
        closeModal(id)
      }, 500)
    } catch (e) {
      console.error('Cleanup error:', e)
      Interact.stopBlocker()
      showToast({ message: 'Error cleaning plugin database', type: 'error' })
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
      <Button slot="left" clear primary on:click={handleClose}>Cancel</Button>
      <Text bold slot="main" className="text-ios-label">Clean Plugin Database</Text>
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4">
    {#if !hasScanned}
      <div class="info-box p-4 rounded-lg">
        <Text bold className="text-ios-label mb-2">What This Does</Text>
        <Text className="text-ios-label2" size="sm">
          Plugins are created by different developers and may store data differently. Over time, duplicate entries can
          accumulate in your plugin database—especially if you've synced data across devices.
        </Text>
        <Text className="text-ios-label2 mt-2" size="sm">
          This tool safely removes these duplicates and cleans up orphaned plugin folders. Your actual plugins and their
          functionality are never affected—only the background storage is tidied up.
        </Text>
        <Text className="text-ios-label2 mt-2" size="sm">
          No changes are made until you confirm. You can always scan again to verify the results.
        </Text>
      </div>

      {#if lastCleanupLog}
        <div class="last-cleanup-box p-3 rounded-lg bg-ios-card">
          <Text bold size="sm" className="text-ios-label mb-1">Last Cleanup</Text>
          <Text size="xs" className="text-ios-label">
            {dayjs(lastCleanupLog.date).format('MMM D, YYYY [at] h:mm A')} ({lastCleanupLog.type})
          </Text>
          <Text size="xs" className="text-ios-label2 mt-1">
            Found {lastCleanupLog.duplicatesFound} duplicate{lastCleanupLog.duplicatesFound === 1 ? '' : 's'} and {lastCleanupLog.rogueFoldersFound}
            rogue folder{lastCleanupLog.rogueFoldersFound === 1 ? '' : 's'}
          </Text>
        </div>
      {/if}

      <Button primary on:click={handleScan} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
      </Button>
    {:else if scanResult}
      {#if scanResult.hasDuplicates}
        <div class="duplicate-alert p-4 rounded-lg flex gap-3 bg-ios-card">
          <div class="flex-shrink-0">
            <IonIcon icon={CircleOutline} className="text-ios-label2" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-ios-label">
              {scanResult.totalDuplicateEntries + scanResult.totalRogueFolders} Issue{scanResult.totalDuplicateEntries +
                scanResult.totalRogueFolders ===
              1
                ? ''
                : 's'} Found
            </Text>
            <Text size="sm" className="text-ios-label2">
              {#if scanResult.totalDuplicateEntries > 0}
                {scanResult.totalDuplicateEntries} duplicate {scanResult.totalDuplicateEntries === 1
                  ? 'entry'
                  : 'entries'}
              {/if}
              {#if scanResult.totalRogueFolders > 0}
                {#if scanResult.totalDuplicateEntries > 0}
                  •
                {/if}
                {scanResult.totalRogueFolders} rogue folder{scanResult.totalRogueFolders === 1 ? '' : 's'}
              {/if}
            </Text>
          </div>
        </div>

        <div class="mt-4">
          <Text bold className="text-ios-label mb-2">Issues Found:</Text>
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
                      {issue.duplicatesFound} duplicate {issue.duplicatesFound === 1 ? 'entry' : 'entries'}
                    {:else if issue.issueType === 'rogue-folder'}
                      Orphaned plugin folder (not in plugins.json)
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
            {isLoading ? 'Cleaning...' : 'Clean Database'}
          </Button>
          <Button
            clear
            on:click={() => {
              scanResult = null
              hasScanned = false
            }}
          >
            Scan Again
          </Button>
        </div>
      {:else}
        <div class="success-box p-4 rounded-lg flex gap-3 bg-ios-goodsoft">
          <div class="flex-shrink-0">
            <IonIcon icon={CheckmarkCircle} className="text-ios-good" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-ios-good">No Issues Found</Text>
            <Text size="sm" className="text-ios-good">
              Your plugin database is clean ({scanResult.totalPluginsInMainList}
              {scanResult.totalPluginsInMainList === 1 ? 'plugin' : 'plugins'}) with no duplicates or rogue folders
            </Text>
          </div>
        </div>

        <Button
          clear
          on:click={() => {
            handleScan()
          }}
        >
          Scan Again
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
