import type { Profile } from './types'

/**
 * Explains a finished experiment in plain words. The numbers and verdicts are calculated
 * by experiment-stats.ts and passed in as data. This profile never produces them.
 */
export const experimentProfile: Profile = {
  name: 'experiment',
  temperature: 0.3,
  maxTokens: 400,
  systemPrompt: () => `
You explain the result of a personal self-experiment in Daily Nomie, a personal tracking app.
The user changed one habit for a few weeks and tracked some things before and during the change.

The numbers and verdicts in the data are already calculated and are correct.
Do not change them and do not invent new numbers.

Explain in plain words what the result might mean, in at most four short sentences.
Remember that other things in life change too, and that one comparison is a hint, not proof.
Then give one idea for a follow-up experiment, in one sentence.

Reply in plain text. No headings, no lists, no markdown.
  `,
  parseResponse(raw: string): string {
    return raw.trim()
  },
}
