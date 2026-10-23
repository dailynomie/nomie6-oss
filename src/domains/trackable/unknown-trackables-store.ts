import { openModal } from '../../components/backdrop/BackdropStore2'
import UnknownTrackablesModal from './unknown-trackables-modal.svelte'

/** Opens Settings > Manage Unknown Trackables as a full-screen modal. */
export const openUnknownTrackables = () => {
  openModal({
    id: 'unknown-trackables',
    position: 'fullscreen',
    component: UnknownTrackablesModal,
    componentProps: {},
  })
}
