// I3: the weekly review. The code counts; the review only shows what was counted.
// Compares the last 7 days with the 7 days before, for each tracker, and lists the trackers that had values.

export const REVIEW_DAYS = 7
export const MAX_TRACKERS_SHOWN = 5

export type TrackerWeek = { tag: string; label: string; total: number; previous: number }
export type Review = {
  days: number
  previousDays: number
  trackers: Array<TrackerWeek>
}

export const buildReview = (input: {
  days: number
  previousDays: number
  trackers: Array<TrackerWeek>
}): Review => ({
  days: input.days,
  previousDays: input.previousDays,
  trackers: input.trackers
    .filter((t) => t.total > 0 || t.previous > 0)
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
    .slice(0, MAX_TRACKERS_SHOWN),
})

/** The numbers the AI writes from: the days, then each tracker's total this week and the week before. */
export const reviewPrompt = (review: Review, language: string): string =>
  [
    `Days logged in the last 7 days: ${review.days}. In the 7 days before: ${review.previousDays}.`,
    'Trackers (last 7 days / the 7 days before):',
    ...review.trackers.map((t) => `- ${t.label}: ${t.total} / ${t.previous}`),
    `Reply in ${language}.`,
  ].join('\n')

/** The text kept as a note: one line for the days, then one line per tracker. */
export const reviewNote = (review: Review, lines: { title: string; days: string; tracker: (t: TrackerWeek) => string }): string =>
  [lines.title, lines.days, ...review.trackers.map(lines.tracker)].join('\n')
