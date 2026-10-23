import NPaths from '../../paths'
import { createArrayStore } from '../../store/ArrayStore'
import { setCustomUoms, type CustomUomItem } from './uom-registry'
import { Lang } from '../../store/lang'

export const CustomUomStore = createArrayStore(NPaths.storage.customUoms(), {
  label: Lang.t('uom.custom-units', 'Custom units'),
  key: 'key',
})

// Every change to the stored units also updates what the app uses to format and look up units,
// so a new unit can be picked in a tracker straight away.
CustomUomStore.subscribe((items: Array<CustomUomItem>) => {
  setCustomUoms(items)
})

export const saveCustomUom = (item: CustomUomItem) => {
  return CustomUomStore.upsert(item)
}

export const removeCustomUom = (key: string) => {
  return CustomUomStore.remove({ key })
}
