import { ExperimentClass } from './experiment-class'
import NPaths from '../../paths'
import { createArrayStore } from '../../store/ArrayStore'

export const ExperimentStore = createArrayStore(NPaths.storage.experiments(), {
  label: 'Experiments',
  key: 'id',
  itemInitializer: (item: any) => {
    return new ExperimentClass(item)
  },
  itemSerializer: (item: ExperimentClass) => {
    return item.asObject
  },
})
