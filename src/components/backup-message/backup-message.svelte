<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../store/lang'

  import { Prefs } from '../../domains/preferences/Preferences'
  import { LaunchCount } from '../../domains/preferences/LaunchCount'
  // import { onMount } from 'svelte'
  import { backupConfirmed, BackupDaysAgo, generateBackup } from '../../domains/backup/BackupStore'
  import { onMount } from 'svelte'

  let visible = $state(false)
  let mounted = $state(false)
  let dayWarning = $state($Prefs.backupDays)
  let lastBackupDaysBack = $state(0)

  $effect(() => {
    if (isNaN($BackupDaysAgo)) {
      lastBackupDaysBack = 1001
    } else {
      lastBackupDaysBack = $BackupDaysAgo
    }
  })

  $effect(() => {
    dayWarning = $Prefs.backupDays
    if (
      mounted &&
      lastBackupDaysBack &&
      dayWarning > -1 &&
      $LaunchCount > 5 &&
      lastBackupDaysBack >= dayWarning &&
      !$Prefs.hideBackupMessage
    ) {
      visible = true
    } else {
      visible = false
    }
  })

  onMount(() => {
    setTimeout(() => {
      mounted = true
    }, 4000)
  })
</script>

{#if mounted && visible === true}
  <!-- iOS look (section 8): white text on a fixed red, so the contrast holds in light and dark mode -->
  <div class="flex text-xs space-x-1 items-center justify-center container-sm ios-banner-danger text-white">
    <button
      aria-label="Backup your data"
      on:click={generateBackup}
      class="flex items-center mr-2 text-xs py-1 text-center rounded-full backup"
    >
      <!--- If it's way back - it's not really set-->
      {#if lastBackupDaysBack > 1000}
        <div class="text-white">
          {Lang.t('general.no-known-backups', 'No recent backups')}
        </div>
      {:else}
        <div class="text-white">
          {lastBackupDaysBack} days since last backup
        </div>
      {/if}
      <div class="ml-2 font-bold">
        {Lang.t('general.download-backup', 'Download Backup')}
      </div>
    </button>
    or
    <button
      class="ml-2 font-bold"
      on:click={() => {
        backupConfirmed()
      }}>Skip</button
    >
  </div>
{/if}
