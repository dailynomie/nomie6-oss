import { closeModal, openModal } from "../../components/backdrop/BackdropStore2";
//import { PluginClass } from "./plugin-helpers";
//import PluginInstallerModal from "./plugin-installer-modal.svelte";
//import pointerModalSvelte from "./pointer-modal.svelte";
import { AllTrackablesAsArray} from '../trackable/TrackableStore'

import type { ITrackables } from '../trackable/trackable-utils'
import { toTrackableArray } from '../trackable/trackable-utils'
import pointersModalSvelte from "./pointers-modal.svelte";


export const openPointersModal = () => {
  openModal({
    id: 'pointers',
    component: pointersModalSvelte,
    componentProps: {

    }
  })
}


export const closePointerModal = () => {

}

export const closePointersModal = () => {
  closeModal('pointers');
}