import { get } from 'svelte/store'
import { Prefs } from '../preferences/Preferences'
import { Interact } from '../../store/interact'
import { Lang } from '../../store/lang'
import { generateBackup } from './BackupStore'

/**
 * One-time notice about the backup bug. Shown once per device, to users who finished setup.
 * The preference is set before the dialog opens, so an interrupted dialog never comes back.
 */
export const showBackupNotice = async (): Promise<void> => {
  const prefs = get(Prefs)
  if (prefs.backupNoticeSeen || !prefs.onboarded) return
  Prefs.update((p) => ({ ...p, backupNoticeSeen: true }))

  const makeBackup = await Interact.confirm(
    Lang.t('backup-notice.title', 'Please make a backup today'),
    Lang.t(
      'backup-notice.message',
      'We found a bug that stopped some backups from including everything, and some backups from August and September could not be restored at all. A regular backup protects your data, so please make one now. It takes a moment, and it includes all your trackers, logs, boards, templates and settings.'
    ),
    Lang.t('backup-notice.now', 'Back up now'),
    Lang.t('backup-notice.later', 'Later')
  )
  if (makeBackup) generateBackup()
}
