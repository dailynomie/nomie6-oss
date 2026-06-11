/**
 * Pointer Store
  Pointers are like categories, or "hard tags", things that help you tag specific posts. 
 */

import { PointerClass } from './pointer-class'
// Stores
import { Interact } from '../../store/interact'
import { LedgerStore } from '../ledger/LedgerStore'
// utils
import Logger from '../../utils/log/log'
import NPaths from '../../paths'
// Vendors
import Storage from '../storage/storage'
import array_utils from '../../utils/array/array_utils'
import { createArrayStore } from '../../store/ArrayStore'
import dayjs from 'dayjs'
// Svelte
import { writable } from 'svelte/store'
import pointersModalSvelte from "./pointers-modal.svelte";
import { closeModal, openModal } from "../../components/backdrop/BackdropStore2";

// Get Config

const console = new Logger('🏷 $PointerStore')

const searchForPointer = async () => {
  let pointers: Array<string> = []
  Interact.blocker('Finding pointer...')
  try {
    const logs = await LedgerStore.query({
      start: dayjs().subtract(6, 'month'),
    })
    logs.forEach((log) => {
      log.getMeta().pointer.forEach((pointer) => {
        pointers.push(pointer.id)
      })
    })
  } catch (e) {
    console.error(e)
    Interact.alert('Error', e.message)
  }
  Interact.stopBlocker()
  return array_utils.unique(pointers)
}



export const PointerStore = createArrayStore(NPaths.storage.pointers(), {
  key: 'tag',
  label: 'Pointer',
  itemInitializer: (item) => {
    return new PointerClass(item)
  },
  itemSerializer: (item: PointerClass) => {
    return item.asObject
  },
})


export const openPointersModal = () => {
  openModal({
    id: 'pointers',
    component: pointersModalSvelte,
    componentProps: {

    }
  })
}

export const closePointersModal = () => {
  closeModal('pointers');
}
