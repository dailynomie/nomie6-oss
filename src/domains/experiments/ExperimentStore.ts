import { ExperimentClass, serializeExperiment, type ExperimentType } from './experiment-class'
import NPaths from '../../paths'
import { createArrayStore } from '../../store/ArrayStore'
import { Lang } from '../../store/lang'

export const ExperimentStore = createArrayStore(NPaths.storage.experiments(), {
  label: Lang.t('experiments.experiments', 'Experiments'),
  key: 'id',
  itemInitializer: (item: any) => {
    return new ExperimentClass(item)
  },
  itemSerializer: (item: ExperimentType | ExperimentClass) => {
    return serializeExperiment(item)
  },
})
