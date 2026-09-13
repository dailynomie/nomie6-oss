<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'
  import { generateBackup } from '../../domains/backup/BackupStore'
  import { showToast } from '../toast/ToastStore'

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(swr: ServiceWorkerRegistration) {
      console.log(`Nomie Service Worker registered`, {
        installing: swr.installing,
        active: swr.active,
        scope: swr.scope,
      })
    },
    onRegisterError(error) {
      console.error('Nomie Service Worker registration error', error)
    },
  })

  let isBackingUp = false
  // TEST MODE: Set to true to test update notification on every startup
  const TEST_MODE = localStorage.getItem('nomie-update-test-mode') === 'true'

  function close() {
    offlineReady.set(false)
    needRefresh.set(false)
  }

  function toggleTestMode() {
    const isEnabled = localStorage.getItem('nomie-update-test-mode') === 'true'
    if (isEnabled) {
      localStorage.removeItem('nomie-update-test-mode')
      alert('✅ Test mode disabled. Reload the app.')
    } else {
      localStorage.setItem('nomie-update-test-mode', 'true')
      alert('✅ Test mode enabled. Reload the app to see the update notification.')
    }
  }

  async function backupAndUpdate() {
    isBackingUp = true
    try {
      const backupSuccess = await generateBackup()
      if (backupSuccess) {
        showToast({ message: '✅ Backup complete! Updating app...', type: 'success' })
        // Wait a moment for the toast to show, then update
        setTimeout(() => {
          updateServiceWorker(true)
        }, 1000)
      } else {
        isBackingUp = false
      }
    } catch (error) {
      console.error('Backup error:', error)
      showToast({ message: '❌ Backup failed. Please try again.', type: 'error' })
      isBackingUp = false
    }
  }

  // TEST MODE: Show notification on every startup when enabled
  $: toast = TEST_MODE || $needRefresh
</script>

{#if toast}
  <div class="install-backdrop" style="z-index:8999">
    <div class="pwa-toast" role="alert">
      <div class="px-2 pb-2 mb-2 text-lg font-medium leading-snug text-black message">
        {#if $offlineReady}
          <span>App ready to work offline</span>
        {:else if $needRefresh || TEST_MODE}
          <h1 class="mb-2 text-2xl font-bold text-black">🎉 Update Available</h1>
          <p>A new version of Nomie is ready to use.</p>
          {#if TEST_MODE}
            <p class="mt-2 text-xs text-gray-600 italic">🧪 TEST MODE - Click toggle button to disable</p>
          {/if}
        {/if}
      </div>

      <div class="flex items-center justify-end space-x-4">
        {#if TEST_MODE}
          <button
            aria-label="Toggle test mode"
            on:click={toggleTestMode}
            class="px-4 py-2 text-xs font-bold bg-yellow-200 text-yellow-800 shadow-sm rounded-xl"
          >
            🧪 Disable Test
          </button>
        {/if}

        <button class="px-4 py-2 filler font-bold bg-white shadow-sm rounded-xl text-primary-600" on:click={close}>
          Later
        </button>

        {#if $needRefresh || TEST_MODE}
          <button
            aria-label="Backup before updating"
            on:click={backupAndUpdate}
            disabled={isBackingUp}
            class="px-4 py-2 font-bold filler bg-white shadow-sm rounded-xl text-green-600 disabled:opacity-50"
          >
            {isBackingUp ? '💾 Backing up...' : '💾 Backup First'}
          </button>
          <button
            aria-label="Update the App"
            on:click={() => updateServiceWorker(true)}
            class="px-4 py-2 font-bold filler bg-white shadow-sm rounded-xl text-primary-600"
          >
            Update Now
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .install-backdrop {
    @apply fixed;
    @apply top-0;
    @apply left-0;
    @apply right-0;
    @apply bottom-0;
    @apply flex;
    @apply flex-col;
    @apply justify-center;
    @apply items-center;
    @apply bg-gray-500;
    @apply bg-opacity-50;
    @apply flex-shrink-0;
    @apply flex-grow-0;
    @apply backdrop-filter backdrop-saturate-150 backdrop-blur-sm;
    padding-bottom: calc(env(safe-area-inset-bottom));
  }
  .pwa-toast {
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 16px;
    min-width: 200px;
    @apply p-4;
    border: 1px solid #8885;
    @apply rounded-xl;
    z-index: 1;
    text-align: left;
    @apply shadow-xl;
    @apply bg-primary-500;
    @apply text-white;
    @apply rounded-xl;
  }
</style>
