import type { Trackable } from '../Trackable.class'
import { openModal } from '../../../components/backdrop/BackdropStore2'
import { writable } from 'svelte/store'

export type TrackableEditorStoreProps = {
  trackable: Trackable | undefined
}
const initialState = {
  trackable: undefined,
}
export const TrackableEditorStore = writable(initialState)

export const openTrackableEditor = async (trackable: Trackable, saveByPass?: Function) => {
  const { default: TrackableEditorModal } = await import('../trackable-editor/trackable-editor-modal.svelte')
  openModal({
    id: `trackable-editor-${trackable.tag}`,
    componentProps: {
      trackable,
      saveByPass,
    },
    component: TrackableEditorModal,
  })

  // TrackableEditorStore.update((s) => {
  //   s.trackable = trackable
  //   return s
  // })
}

export const closeTrackableEditor = () => {
  TrackableEditorStore.update((s) => {
    s.trackable = undefined
    return s
  })
}
