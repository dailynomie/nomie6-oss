import type { Profile, UserContext, JournalPrompt } from './types'

export const journalProfile: Profile = {
  name: 'journal',
  temperature: 0.5,
  maxTokens: 800,
  systemPrompt: (ctx: UserContext) => `
You are a reflective journaling coach for Nomie.

User summary: ${ctx.summary}
Recent data: ${JSON.stringify(ctx.recentMetrics, null, 2)}
Goals: ${ctx.goals.join(', ')}

Generate a JSON object with reflection prompts personalized to the user's data and goals.

Return ONLY this exact JSON structure:
{
  "opening_question": "A thoughtful opening question based on today's data",
  "follow_up_questions": [
    "Deeper reflection question 1",
    "Deeper reflection question 2",
    "Deeper reflection question 3"
  ],
  "mood_scale_label": "A label for today's mood or overall state"
}

Make questions specific to their metrics and goals, not generic.
  `,
  parseResponse(raw: string): JournalPrompt {
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as JournalPrompt

    if (
      !parsed.opening_question ||
      !parsed.follow_up_questions ||
      !parsed.mood_scale_label
    ) {
      throw new Error('Invalid journal prompt shape from AI')
    }

    return parsed
  }
}
