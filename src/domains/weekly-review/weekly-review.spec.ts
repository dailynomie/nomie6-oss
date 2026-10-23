import { describe, it, expect } from 'vitest'
import { buildReview, reviewNote, reviewPrompt, MAX_TRACKERS_SHOWN } from './weekly-review'

describe('buildReview', () => {
  it('keeps the trackers with values, the biggest total first', () => {
    const review = buildReview({
      days: 5,
      previousDays: 4,
      trackers: [
        { tag: 'walk', label: 'Walk', total: 3, previous: 1 },
        { tag: 'coffee', label: 'Coffee', total: 9, previous: 12 },
        { tag: 'sleep', label: 'Sleep', total: 0, previous: 0 },
      ],
    })
    expect(review.trackers.map((t) => t.tag)).toEqual(['coffee', 'walk'])
    expect(review.days).toBe(5)
    expect(review.previousDays).toBe(4)
  })

  it('shows at most five trackers', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ tag: `t${i}`, label: `T${i}`, total: i + 1, previous: 0 }))
    expect(buildReview({ days: 7, previousDays: 0, trackers: many }).trackers).toHaveLength(MAX_TRACKERS_SHOWN)
  })

  it('keeps a tracker that only had values last week, so the change shows', () => {
    const review = buildReview({ days: 7, previousDays: 7, trackers: [{ tag: 'mood', label: 'Mood', total: 0, previous: 4 }] })
    expect(review.trackers).toHaveLength(1)
  })
})

describe('reviewNote', () => {
  it('writes the title, the days, and one line per tracker', () => {
    const review = buildReview({
      days: 5,
      previousDays: 4,
      trackers: [{ tag: 'coffee', label: 'Coffee', total: 9, previous: 12 }],
    })
    const note = reviewNote(review, {
      title: 'Weekly review',
      days: `${review.days} days`,
      tracker: (t) => `${t.label}: ${t.total} (${t.previous})`,
    })
    expect(note).toBe('Weekly review\n5 days\nCoffee: 9 (12)')
  })
})

describe('reviewPrompt', () => {
  it('gives the numbers and the language, and nothing else', () => {
    const review = buildReview({ days: 6, previousDays: 7, trackers: [{ tag: 'mood', label: 'Mood', total: 33, previous: 36 }] })
    expect(reviewPrompt(review, 'English')).toBe(
      'Days logged in the last 7 days: 6. In the 7 days before: 7.\nTrackers (last 7 days / the 7 days before):\n- Mood: 33 / 36\nReply in English.'
    )
  })
})
