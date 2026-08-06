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
  import { CloseOutline, CircleOutline, CheckmarkCircle } from '../../components/icon/nicons'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import { Interact } from '../../store/interact'
  import { showToast } from '../../components/toast/ToastStore'

  import type { DedupResult } from './plugin-dedup'
  import { scanForPluginDuplicates, cleanupPluginDuplicates } from './plugin-dedup'

  const id = 'plugin-dedup-modal'

  let isScanning = $state(false)
  let isLoading = $state(false)
  let scanResult: DedupResult | null = $state(null)
  let hasScanned = $state(false)

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
      await cleanupPluginDuplicates()
      Interact.stopBlocker()
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
      <Button slot="left" clear icon on:click={handleClose}>
        <IonIcon icon={CloseOutline} className="text-gray-700 dark:text-gray-300" />
      </Button>
      <Text bold slot="main" className="text-gray-900 dark:text-white">
        Clean Plugin Database
      </Text>
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4">
    {#if !hasScanned}
      <div class="info-box p-4 rounded-lg">
        <Text bold className="text-gray-800 dark:text-gray-100 mb-2">What This Does</Text>
        <Text className="text-gray-700 dark:text-gray-200" size="sm">
          Plugins are created by different developers and may store data differently. Over time, duplicate entries can accumulate in your plugin database—especially if you've synced data across devices.
        </Text>
        <Text className="text-gray-700 dark:text-gray-200 mt-2" size="sm">
          This tool safely removes these duplicates and cleans up orphaned plugin folders. Your actual plugins and their functionality are never affected—only the background storage is tidied up.
        </Text>
        <Text className="text-gray-700 dark:text-gray-200 mt-2" size="sm">
          No changes are made until you confirm. You can always scan again to verify the results.
        </Text>
      </div>

      <Button
        primary
        on:click={handleScan}
        disabled={isScanning}
      >
        {isScanning ? 'Scanning...' : 'Scan for Duplicates'}
      </Button>
    {:else if scanResult}
      {#if scanResult.hasDuplicates}
        <div class="duplicate-alert p-4 rounded-lg flex gap-3">
          <div class="flex-shrink-0">
            <IonIcon icon={CircleOutline} className="text-orange-500 dark:text-orange-400" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-orange-900 dark:text-orange-100">
              {scanResult.totalDuplicateEntries + scanResult.totalRogueFolders} Issue{scanResult.totalDuplicateEntries + scanResult.totalRogueFolders === 1 ? '' : 's'} Found
            </Text>
            <Text size="sm" className="text-orange-800 dark:text-orange-200">
              {#if scanResult.totalDuplicateEntries > 0}
                {scanResult.totalDuplicateEntries} duplicate {scanResult.totalDuplicateEntries === 1 ? 'entry' : 'entries'}
              {/if}
              {#if scanResult.totalRogueFolders > 0}
                {#if scanResult.totalDuplicateEntries > 0} • {/if}
                {scanResult.totalRogueFolders} rogue folder{scanResult.totalRogueFolders === 1 ? '' : 's'}
              {/if}
            </Text>
          </div>
        </div>

        <div class="mt-4">
          <Text bold className="text-gray-900 dark:text-white mb-2">Issues Found:</Text>
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
                  <Text bold className="text-gray-900 dark:text-white">
                    {issue.pluginName}
                  </Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-400">
                    {#if issue.issueType === 'duplicates-in-file'}
                      {issue.duplicatesFound} duplicate {issue.duplicatesFound === 1 ? 'entry' : 'entries'}
                    {:else if issue.issueType === 'rogue-folder'}
                      Orphaned plugin folder (not in plugins.json)
                    {/if}
                  </Text>
                  <Text size="xs" className="text-gray-500 dark:text-gray-500 mt-1">
                    {issue.fileLocation}
                  </Text>
                </div>
              </ListItem>
            {/each}
          </List>
        </div>

        <div class="mt-6 space-y-2">
          <Button
            primary
            on:click={handleCleanup}
            disabled={isLoading}
          >
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
        <div class="success-box p-4 rounded-lg flex gap-3">
          <div class="flex-shrink-0">
            <IonIcon icon={CheckmarkCircle} className="text-green-500 dark:text-green-400" size={20} />
          </div>
          <div class="flex-grow">
            <Text bold className="text-green-900 dark:text-green-100">
              No Issues Found
            </Text>
            <Text size="sm" className="text-green-800 dark:text-green-200">
              Your plugin database is clean ({scanResult.totalPluginsInMainList} {scanResult.totalPluginsInMainList === 1 ? 'plugin' : 'plugins'}) with no duplicates or rogue folders
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
  :global(.info-box) {
    background-color: #eff6ff;
  }

  :global(.dark .info-box) {
    background-color: #0c2940;
  }

  :global(.duplicate-alert) {
    background-color: #fffbeb;
  }

  :global(.dark .duplicate-alert) {
    background-color: #78350f;
  }

  :global(.success-box) {
    background-color: #f0fdf4;
  }

  :global(.dark .success-box) {
    background-color: #1b4332;
  }
</style>
