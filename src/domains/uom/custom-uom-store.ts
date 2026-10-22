import NPaths from '../../paths'
import { createArrayStore } from '../../store/ArrayStore'
import { setCustomUoms, type CustomUomItem } from './uom-registry'

export const CustomUomStore = createArrayStore(NPaths.storage.customUoms(), {
  label: 'Custom units',
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
