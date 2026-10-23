import { Prefs, setDocumentTheme } from '../preferences/Preferences'

import { ActiveLogStore } from '../capture-log/CaptureLogStore'
import CreateOutline from '../../n-icons/CreateOutline.svelte'
import NLog from '../nomie-log/nomie-log'
import type { PopMenuButton } from '../../components/pop-menu/usePopmenu'
import { Trackable } from '../trackable/Trackable.class'
import { TrackerLibrary } from '../library/tracker-library'
import { addNewPerson, getAddPersonButton } from '../board/boardActions'
import { generateBackup } from '../backup/BackupStore'
import { openTrackableEditor } from '../trackable/trackable-editor/TrackableEditorStore'
import { closeUnisearch } from './UnisearchStore'
import { Lang } from '../../store/lang'

export const unisearchCommands: Array<PopMenuButton> = [
  {
    title: Lang.t('search.create-custom-tracker', 'Create Custom tracker'),
    description: Lang.t('search.create-and-add-a-new-tracker', 'Create and Add a new tracker!'),
    click() {
      openTrackableEditor(
        new Trackable({
          type: 'tracker',
        })
      )
    },
  },
  getAddPersonButton(),
  {
    title: Lang.t('search.write-journal-entry', 'Write Journal Entry'),
    icon: CreateOutline,
    description: Lang.t(
      'search.browse-the-nomie-library-of-trackers-add-create',
      'Browse the nomie library of trackers, add create'
    ),
    click() {
      ActiveLogStore.journal(new NLog({}))
    },
  },
  {
    title: Lang.t('search.open-library', 'Open Library'),
    description: Lang.t(
      'search.browse-the-nomie-library-of-trackers-add-create',
      'Browse the nomie library of trackers, add create'
    ),
    click() {
      TrackerLibrary.toggle()
    },
  },
  {
    title: Lang.t('search.dark-theme', 'Dark Theme'),
    click() {
      Prefs.update((s) => {
        s.theme = 'dark'
        setDocumentTheme(s.theme)
        closeUnisearch()
        return s
      })
    },
  },
  {
    title: Lang.t('search.light-theme', 'Light Theme'),
    click() {
      Prefs.update((s) => {
        s.theme = 'light'
        setDocumentTheme(s.theme)
        closeUnisearch()
        return s
      })
    },
  },
  {
    title: Lang.t('search.system-theme', 'System Theme'),
    click() {
      Prefs.update((s) => {
        s.theme = 'auto'
        setDocumentTheme(s.theme)
        closeUnisearch()
        return s
      })
    },
  },
  {
    title: Lang.t('search.generate-backup', 'Generate Backup'),
    click() {
      generateBackup()
    },
  },
]
