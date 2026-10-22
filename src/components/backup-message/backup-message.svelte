<svelte:options runes={true} />

<script lang="ts">
  import { TrackableStore } from '../../domains/trackable/TrackableStore'
  import { Lang } from '../../store/lang'

  import { Prefs } from '../../domains/preferences/Preferences'
  // import { onMount } from 'svelte'
  import { onMount } from 'svelte'

  // The screen supplies the backup values and actions (CMP-08)
  const { daysAgo = NaN, launchCount = 0, onGenerate = () => {}, onConfirmed = () => {} } = $props()

  let visible = $state(false)
  let mounted = $state(false)
  let dayWarning = $state($Prefs.backupDays)
  let lastBackupDaysBack = $state(0)

  $effect(() => {
    if (isNaN(daysAgo)) {
      lastBackupDaysBack = 1001
    } else {
      lastBackupDaysBack = daysAgo
    }
  })

  $effect(() => {
    dayWarning = $Prefs.backupDays
    if (
      mounted &&
      lastBackupDaysBack &&
      dayWarning > -1 &&
      launchCount > 5 &&
      lastBackupDaysBack >= dayWarning &&
      !$Prefs.hideBackupMessage &&
      // Phase 7 (new users): nothing to back up until the first tracker exists
      Object.keys($TrackableStore.trackables).length > 0
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
      aria-label={Lang.t('ui.backup-your-data', 'Backup your data')}
      on:click={onGenerate}
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
    <span class="mx-1">{Lang.t('ui.or', 'or')}</span>
    <button
      class="ml-2 font-bold text-ios-tint"
      on:click={() => {
        onConfirmed()
      }}>{Lang.t('ui.skip', 'Skip')}</button
    >
  </div>
{/if}
