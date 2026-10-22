import type { ExperimentType } from './experiment-class'

export { EXPERIMENT_BOARD_ID } from '../../config/board-ids'

/** The elements of the experiments board: the check-in tracker of every experiment, running or finished. */
export const experimentBoardElements = (experiments: Array<Pick<ExperimentType, 'adherenceTag'>>): Array<string> =>
  experiments.filter((experiment) => experiment.adherenceTag).map((experiment) => `#${experiment.adherenceTag}`)
