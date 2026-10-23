import { findLink, SUGGESTION_RULE, type Link, type Series } from './link-finder'

// The background analysis of Find links: every pair of items, both ways round, ranked by how clear the link is.

export type LinkItemLike = { key: string; label: string; type: string; series: Series }
export type Suggestion = { a: LinkItemLike; b: LinkItemLike; link: Link }

export const SUGGESTION_LIMIT = 10

/** The clear links between any two items, the clearest first. */
export const suggestLinks = (items: Array<LinkItemLike>, limit: number = SUGGESTION_LIMIT): Array<Suggestion> => {
  const found: Array<Suggestion> = []
  for (const a of items) {
    for (const b of items) {
      if (a.key === b.key) continue
      // a same-day link is the same fact from either side, so only the stronger direction is kept
      const sameDay = findLink(a.series, b.series, 0, SUGGESTION_RULE)
      const reverse = findLink(b.series, a.series, 0, SUGGESTION_RULE)
      if (sameDay && (!reverse || sameDay.matches / sameDay.total >= reverse.matches / reverse.total)) {
        if (!(reverse && sameDay.matches / sameDay.total === reverse.matches / reverse.total && a.key > b.key)) {
          found.push({ a, b, link: sameDay })
        }
      }
      // a next-day link says something different in each direction, so both are kept
      const nextDay = findLink(a.series, b.series, 1, SUGGESTION_RULE)
      if (nextDay) found.push({ a, b, link: nextDay })
    }
  }
  return found
    .sort((x, y) => {
      const shareX = x.link.matches / x.link.total
      const shareY = y.link.matches / y.link.total
      return shareY - shareX || y.link.total - x.link.total || x.a.label.localeCompare(y.a.label)
    })
    .slice(0, limit)
}
