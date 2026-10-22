import { writable } from 'svelte/store'
import { openModal } from '../../../../components/backdrop/BackdropStore2'
import { WidgetClass } from '../widget-class'
export type WidgetEditorProps = {
  widget?: WidgetClass
  onSave?: Function
  onCancel?: Function
}
const initialState: WidgetEditorProps = {}
export const WidgetEditorStore = writable(initialState)

export const openWidgetEditor = async (props: WidgetEditorProps) => {
  const { default: WidgetEditorModal } = await import('./widget-editor-modal.svelte')
  openModal({
    id: `widget-editor-${props.widget.id || ''}`,
    component: WidgetEditorModal,
    componentProps: {
      props,
    },
  })
  // WidgetEditorStore.update((s) => {
  //   s = { ...s, ...props }
  //   return s
  // })
}

export const editWidget = (widget: WidgetClass) => {
  return new Promise((resolve) => {
    openWidgetEditor({
      widget,
      onSave(evt) {
        resolve(evt)
      },
    })
  })
}

export const createNewWidget = () => {
  return new Promise((resolve) => {
    openWidgetEditor({
      widget: new WidgetClass({}),
      onSave(evt) {
        resolve(evt)
      },
    })
  })
}

export const closeWidgetEditor = () => {
  WidgetEditorStore.update((s) => {
    return {}
  })
}
