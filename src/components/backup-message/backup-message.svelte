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
  <!-- iOS look (D-caution): a backup reminder is a caution, so it is a neutral card with a warning glyph; red is only for destructive actions -->
  <div class="flex text-xs space-x-1 items-center justify-center container-sm ios-caution text-ios-label">
    <span aria-hidden="true">⚠︎</span>
    <button
      aria-label="Backup your data"
      on:click={generateBackup}
      class="flex items-center mr-2 text-xs py-1 text-center rounded-full backup"
    >
      <!--- If it's way back - it's not really set-->
      {#if lastBackupDaysBack > 1000}
        <div class="text-ios-label">
          {Lang.t('general.no-known-backups', 'No recent backups')}
        </div>
      {:else}
        <div class="text-ios-label">
          {lastBackupDaysBack} days since last backup
        </div>
      {/if}
      <div class="ml-2 font-bold text-ios-tint">
        {Lang.t('general.download-backup', 'Download Backup')}
      </div>
    </button>
    <span class="mx-1">or</span>
    <button
      class="ml-2 font-bold text-ios-tint"
      on:click={() => {
        backupConfirmed()
      }}>Skip</button
    >
  </div>
{/if}
