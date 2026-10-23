import { openModal } from '../../../components/backdrop/BackdropStore2'
import type { CustomUomItem } from '../uom-registry'
import UomEditorModal from './uom-editor-modal.svelte'

/**
 * Open the editor for a custom unit. Without a unit, the editor creates a new one.
 */
export const openUomEditor = (unit?: CustomUomItem) => {
  openModal({
    id: 'uom-editor',
    position: 'fullscreen',
    component: UomEditorModal,
    componentProps: {
      unit,
    },
  })
}
