import { closeModal, openModal } from '../../components/backdrop/BackdropStore2'
import { writable } from 'svelte/store'

const initialState = {
  show: false,
}

export const ImporterStore = writable(initialState)

export const showImportModal = async (archive?: any) => {
  const { default: ImporterModal } = await import('./importer.svelte')
  openModal({
    id: 'importer',
    component: ImporterModal,
    componentProps: {
      fileData: archive,
    },
    position: 'bottom',
  })
  // ImporterStore.update((s) => {
  //   s.show = true
  //   return s
  // })
}

export const hideImportModal = () => {
  closeModal('importer')
}

export const showCSVImportModal = async (archive?: any) => {
  const { default: csvImportView } = await import('../import/csv/csv-import-view.svelte')
  openModal({
    id: 'csv-importer',
    component: csvImportView,
    componentProps: {
      fileUpload: archive,
    },
    // position: 'bottom',
  })
  // ImporterStore.update((s) => {
  //   s.show = true
  //   return s
  // })
}
