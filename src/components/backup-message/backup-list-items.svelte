<svelte:options runes={true} />

<script lang="ts">
  // The screen supplies the backup action (CMP-08)
  const { onGenerate = () => {} } = $props()
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { CloudUploadOutline, NotificationsOutline } from '../../components/icon/nicons'
  import SelectPop from '../../select-pop/select-pop.svelte'
  import { Lang } from '../../store/lang'
  import ListItem from '../list-item/list-item.svelte'
  import List from '../list/list.svelte'
  import IconSquare from '../icon-square/icon-square.svelte'
  import dayjs from 'dayjs'
  import { Prefs } from './../../domains/preferences/Preferences'

  let daysToBackup = $state($Prefs.backupDays || 7)

  $effect(() => {
    if ($Prefs.backupDays) {
      daysToBackup = $Prefs.backupDays
    }
  })

  let backupOptions = $derived([
    {
      key: -1,
      value: 'Never',
      selected: `${daysToBackup}` == '-1',
    },
    {
      key: 1,
      value: 'Daily',
      selected: `${daysToBackup}` == '1',
    },
    {
      key: 3,
      value: 'Every Few Days',
      selected: `${daysToBackup}` == '3',
    },
    {
      key: 7,
      value: 'Weekly',
      selected: `${daysToBackup}` == '7',
    },
    {
      key: 14,
      value: 'Every Other Week',
      selected: `${daysToBackup}` == '14',
    },
  ])

  let selectedBackupLabel = $derived((backupOptions.find((s) => s.selected) || {}).value)

  let lastBackupText = $derived(
    $Prefs.lastBackup
      ? `Last backup ${dayjs($Prefs.lastBackup).fromNow()} · everything included`
      : 'Never backed up · everything included'
  )
</script>

<List solo>
  <!-- iOS look (guide 5.11): "Back up now" is a two-line row with a green square -->
  <ListItem
    bottomLine={57}
    detail
    title={Lang.t('ui.back-up-now', 'Back up now')}
    titleClass="text-ios-tint"
    description={lastBackupText}
    on:click={() => {
      onGenerate()
    }}
  >
    <span slot="left"><IconSquare color="#0E5F66"><IonIcon icon={CloudUploadOutline} size={17} /></IconSquare></span>
  </ListItem>
  <ListItem bottomLine={57} title={Lang.t('settings.backup-reminder', 'Backup Reminder')}>
    <span slot="left"><IconSquare color="#0E6F78"><IonIcon icon={NotificationsOutline} size={17} /></IconSquare></span>
    <div slot="right">
      <SelectPop
        id="start-page"
        value={selectedBackupLabel}
        on:change={(evt) => {
          $Prefs.backupDays = evt.detail.key
        }}
        options={backupOptions}
      />
    </div>
  </ListItem>
</List>
