import { shiftDay } from '../experiments/experiment-data'

// I1: a link between two trackers. The code decides; the AI (if used) only explains.
// Rule: on the days when tracker A is above its usual level (its median), look at tracker B on the same day
// (lag 0) or the next day (lag 1). Count how often B is below its usual level, or above it. A link is shown
// when there are at least MIN_LINK_DAYS days with a value, and the majority direction covers CLEAR_SHARE of them.

export const MIN_LINK_DAYS = 7
export const CLEAR_SHARE = 0.65

export type Series = { [day: string]: number | undefined }
export type LinkDirection = 'lower' | 'higher'
export type Link = { lag: 0 | 1; direction: LinkDirection; matches: number; total: number }

export const median = (values: Array<number>): number => {
  const sorted = [...values].sort((x, y) => x - y)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const valuesOf = (series: Series): Array<number> =>
  Object.values(series).filter((v): v is number => v !== undefined)

/** The link from A to B at one lag, or undefined when the data does not show a clear one. */
export const findLink = (a: Series, b: Series, lag: 0 | 1): Link | undefined => {
  const aDays = Object.keys(a).filter((day) => a[day] !== undefined)
  const aValues = valuesOf(a)
  const bValues = valuesOf(b)
  if (aValues.length < MIN_LINK_DAYS || bValues.length < MIN_LINK_DAYS) return undefined

  const aUsual = median(aValues)
  const bUsual = median(bValues)
  let lower = 0
  let higher = 0
  for (const day of aDays) {
    if ((a[day] as number) <= aUsual) continue
    const next = b[shiftDay(day, lag)]
    if (next === undefined || next === bUsual) continue
    if (next < bUsual) lower++
    else higher++
  }

  const total = lower + higher
  if (total < MIN_LINK_DAYS) return undefined
  const matches = Math.max(lower, higher)
  if (matches / total < CLEAR_SHARE) return undefined
  return { lag, direction: lower >= higher ? 'lower' : 'higher', matches, total }
}

/** Every clear link between A and B, same day first, then the next day. */
export const findLinks = (a: Series, b: Series): Array<Link> =>
  ([0, 1] as const).map((lag) => findLink(a, b, lag)).filter((link): link is Link => !!link)
