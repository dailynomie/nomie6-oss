import { get } from 'svelte/store'
import { Interact } from '../../store/interact'
import { Lang } from '../../store/lang'
import { Prefs } from '../preferences/Preferences'
import { TrackableStore } from '../trackable/TrackableStore'
import { generateBackup } from './BackupStore'

// Backups made between 14 September 2026 and the backup fix do not contain templates, awards, units or settings.
// Existing users are asked once to make a new backup. The question is asked when the user has trackers, and only once.
export const showFreshBackupPrompt = async () => {
  if (get(Prefs).freshBackupPromptSeen) return
  if (Object.keys(get(TrackableStore).trackables || {}).length === 0) return

  Prefs.update((p) => {
    p.freshBackupPromptSeen = true
    return p
  })

  const backUp = await Interact.confirm(
    Lang.t('export.fresh-backup-title', 'Make a fresh backup'),
    Lang.t(
      'export.fresh-backup-message',
      'Backups made before the backup fix did not include your templates, awards, units or settings. A new backup keeps everything.'
    ),
    Lang.t('ui.back-up-now', 'Back up now'),
    Lang.t('ui.later', 'Later')
  )
  if (backUp) {
    await generateBackup()
  }
}
