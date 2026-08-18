import { openModal } from '../../components/backdrop/BackdropStore2'
import MigrationNoticeModal from './migration-notice-modal.svelte'

const MIGRATION_NOTICE_KEY = 'migration-notice-last-shown'
const NOTICE_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds

export const shouldShowMigrationNotice = (): boolean => {
  const lastShown = localStorage.getItem(MIGRATION_NOTICE_KEY)

  if (!lastShown) {
    // First time - show it
    return true
  }

  const lastShownTime = parseInt(lastShown, 10)
  const now = Date.now()

  // Show if 2 days have passed
  return (now - lastShownTime) >= NOTICE_INTERVAL_MS
}

export const showMigrationNotice = (): void => {
  if (shouldShowMigrationNotice()) {
    // Update the last shown timestamp
    localStorage.setItem(MIGRATION_NOTICE_KEY, Date.now().toString())

    // Open the modal
    openModal({
      id: 'migration-notice',
      component: MigrationNoticeModal,
    })
  }
}
