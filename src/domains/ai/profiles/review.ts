import type { Profile } from './types'

/**
 * A short weekly review (I3). The numbers are calculated by the code and passed in as data.
 * The reply is three short sentences at most, in the language named in the data.
 */
export const reviewProfile: Profile = {
  name: 'review',
  temperature: 0.3,
  maxTokens: 220,
  systemPrompt: () => `
You write a short weekly review for a person who tracks their life in Daily Nomie, a personal tracking app.

The numbers in the data are already calculated and are correct. Use them exactly.
Do not add numbers, dates, trackers or days that are not in the data.

Write at most three short sentences:
1. How many days were logged this week, compared with the week before.
2. The tracker that changed most, and how much it changed.
3. One small, concrete suggestion for next week.

If nothing was logged, say so in one sentence and suggest logging one thing tomorrow.

Reply in the language named in the data. Plain text only: no headings, no lists, no markdown.
  `,
  parseResponse(raw: string): string {
    return raw.trim()
  },
}
