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
        <IonIcon icon={CloseOutline} />
      </Button>
      <Text bold slot="center" className="text-gray-900 dark:text-white">
        Clean Plugin Database
      </Text>
    </ToolbarGrid>
  </header>

  <main class="filler space-y-4 p-4">
    {#if !hasScanned}
      <div class="info-box p-4 rounded-lg">
        <Text className="text-gray-700 dark:text-gray-200" size="sm">
          This tool scans your plugin storage for duplicate entries that can occur due to sync conflicts in CouchDB.
          No data will be modified until you choose to clean.
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
              {scanResult.totalDuplicateEntries} Duplicate {scanResult.totalDuplicateEntries === 1 ? 'Entry' : 'Entries'} Found
            </Text>
            <Text size="sm" className="text-orange-800 dark:text-orange-200">
              {scanResult.pluginsWithDuplicates.length} {scanResult.pluginsWithDuplicates.length === 1 ? 'plugin has' : 'plugins have'} duplicate data
            </Text>
          </div>
        </div>

        <div class="mt-4">
          <Text bold className="text-gray-900 dark:text-white mb-2">Plugins with Duplicates:</Text>
          <List transparent>
            {#each scanResult.pluginsWithDuplicates as dup (dup.pluginId)}
              <ListItem bottomLine={16}>
                <div slot="left" class="text-lg">{dup.pluginId}</div>
                <div class="flex-grow">
                  <Text bold className="text-gray-900 dark:text-white">
                    {dup.pluginName}
                  </Text>
                  <Text size="sm" className="text-gray-600 dark:text-gray-400">
                    {dup.count} copies found
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
              No Duplicates Found
            </Text>
            <Text size="sm" className="text-green-800 dark:text-green-200">
              Your plugin database is clean ({scanResult.totalPluginsInMainList} {scanResult.totalPluginsInMainList === 1 ? 'plugin' : 'plugins'})
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
